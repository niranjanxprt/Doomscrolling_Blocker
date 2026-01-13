from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import logging
from io import BytesIO
from PIL import Image
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Doomscrolling Blocker API")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class ImageData(BaseModel):
    image: str

class DetectionResponse(BaseModel):
    doomscrolling: bool
    message: str
    boxes: list = []  # Added to return coordinates

class DoomscrollDetectorAPI:
    def __init__(self):
        """Initialize detector for API use (no GUI)"""
        try:
            import dlib
            self.use_dlib = True
            self.detector = dlib.get_frontal_face_detector()
            self.predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
            logger.info("Using dlib for face tracking")
        except:
            self.use_dlib = False
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            
            # Load roasting messages from root config
            import json
            try:
                # Try both paths just in case
                config_path = "../config.json" if os.path.exists("../config.json") else "config.json"
                with open(config_path, "r") as f:
                    config = json.load(f)
                    self.roasts = config['roasting']['messages']
            except Exception as e:
                logger.warning(f"Could not load roasts: {e}")
                self.roasts = ["PUT. THE. PHONE. DOWN. NOW."]
            
            logger.info("Using OpenCV Haar Cascades for face tracking")

    def detect_doomscroll(self, frame):
        """Detect doomscrolling from a single frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if self.use_dlib:
            return self._detect_dlib(frame, gray)
        else:
            return self._detect_opencv(frame, gray)

    def _detect_opencv(self, frame, gray):
        """OpenCV-based detection with score-based smoothing"""
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        boxes = []
        is_doomscrolling = False
        
        for (x, y, w, h) in faces:
            boxes.append({"type": "face", "x": int(x), "y": int(y), "w": int(w), "h": int(h)})
            roi_gray = gray[y:y+int(h*0.6), x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray, 1.1, 5)
            
            detection_score = 0
            face_center_y = y + h//2
            frame_height = frame.shape[0]
            face_position_ratio = face_center_y / frame_height
            
            # Relaxed thresholds (main.py uses 0.58)
            # 0.65+ is very likely doomscrolling, 0.58+ is suspicious
            if face_position_ratio > 0.65:
                detection_score += 2
            elif face_position_ratio > 0.58:
                detection_score += 1
            
            aspect_ratio = h / w
            if aspect_ratio < 1.1:
                detection_score += 1
            
            if len(eyes) >= 2:
                for (ex, ey, ew, eh) in eyes:
                    boxes.append({
                        "type": "eye", 
                        "x": int(x + ex), 
                        "y": int(y + ey), 
                        "w": int(ew), 
                        "h": int(eh)
                    })
                eye_y_positions = [y + ey + eh//2 for (ex, ey, ew, eh) in eyes]
                avg_eye_y = sum(eye_y_positions) / len(eye_y_positions)
                eye_position_in_face = (avg_eye_y - y) / h
                
                # Eyes below 60% of face height is bad (main.py uses 0.6)
                if eye_position_in_face > 0.62:
                    detection_score += 2
                elif eye_position_in_face > 0.58:
                    detection_score += 1
            elif len(eyes) < 2:
                # One eye or no eyes often happens when looking down sharply
                detection_score += 1
            
            # Threshold of 3 (was 4) to be more responsive like main.py
            if detection_score >= 3:
                is_doomscrolling = True
                
            logger.info(f"Detection - Ratio: {face_position_ratio:.2f}, Score: {detection_score}")
        
        return is_doomscrolling, boxes

    def _detect_dlib(self, frame, gray):
        """dlib-based detection"""
        faces = self.detector(gray)
        boxes = []
        is_doomscrolling = False
        
        for face in faces:
            x, y, w, h = face.left(), face.top(), face.width(), face.height()
            boxes.append({"type": "face", "x": int(x), "y": int(y), "w": int(w), "h": int(h)})
            
            landmarks = self.predictor(gray, face)
            nose_tip = (landmarks.part(30).x, landmarks.part(30).y)
            chin = (landmarks.part(8).x, landmarks.part(8).y)
            forehead_approx = (landmarks.part(27).x, landmarks.part(27).y)
            
            left_eye_points = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(36, 42)]
            right_eye_points = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(42, 48)]
            
            left_eye_top = (left_eye_points[1][1] + left_eye_points[2][1]) / 2
            left_eye_bottom = (left_eye_points[4][1] + left_eye_points[5][1]) / 2
            left_eye_center = (left_eye_points[0][1] + left_eye_points[3][1]) / 2
            
            right_eye_top = (right_eye_points[1][1] + right_eye_points[2][1]) / 2
            right_eye_bottom = (right_eye_points[4][1] + right_eye_points[5][1]) / 2
            right_eye_center = (right_eye_points[0][1] + right_eye_points[3][1]) / 2
            
            left_ratio = abs(left_eye_center - left_eye_top) / (abs(left_eye_bottom - left_eye_top) + 1e-6)
            right_ratio = abs(right_eye_center - right_eye_top) / (abs(right_eye_bottom - right_eye_top) + 1e-6)
            eye_ratio = (left_ratio + right_ratio) / 2
            
            head_tilt = (chin[1] - nose_tip[1]) / (nose_tip[1] - forehead_approx[1] + 1e-6)
            
            if head_tilt > 1.3 or eye_ratio < 0.35:
                is_doomscrolling = True
        
        return is_doomscrolling, boxes

# Initialize detector
detector = DoomscrollDetectorAPI()

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the main page"""
    with open("templates/index.html", "r") as f:
        return f.read()

@app.post("/api/detect", response_model=DetectionResponse)
async def detect(data: ImageData):
    """API endpoint for detection"""
    try:
        # Decode base64 image
        image_data = data.image.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to OpenCV format
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Detect
        is_doomscrolling, boxes = detector.detect_doomscroll(frame)
        
        import random
        message = random.choice(detector.roasts) if is_doomscrolling else 'Good posture!'
        
        return DetectionResponse(
            doomscrolling=is_doomscrolling,
            message=message,
            boxes=boxes
        )
    
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint for Render"""
    return {"status": "healthy"}
