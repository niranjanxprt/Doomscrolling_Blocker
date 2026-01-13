# Doomscrolling Blocker 📱🚫

A powerful application that uses your webcam to detect when you're looking down at your phone (aka doomscrolling) and triggers a Rickroll punishment to get you back to focus!

> [!NOTE]
> This project is inspired by and based on [kristelTech/Doomscrolling_Blocker](https://github.com/kristelTech/Doomscrolling_Blocker). This version adds a premium web interface, improved detection smoothing, and a "Back to Work" cooldown mechanism.

---

## 🚀 Web Edition (Recommended)

The Web Edition provides a premium, glassmorphism-style dashboard with real-time feedback and a state-of-the-art detection visualization.

### Features
- **Premium Dark Mode UI**: Modern glassmorphism aesthetic with smooth animations.
- **Real-time Visualization**: Bounding boxes for face and eye detection.
- **Stateful Smoothing**: Prevents false triggers from brief glances; triggers only after 2 consecutive "bad" detections.
- **"Back to Work" Mechanism**: Manual dismissal with a 10-second cooldown period.
- **Cloud Ready**: Optimized for deployment on Render.com.

### Local Setup (Web)
1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Run the Application**:
   ```bash
   cd web
   python -m uvicorn app:app --reload
   ```
3. **Access the App**: Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Cloud Deployment (Render)
1. **Fork/Push** this repository to GitHub.
2. **Create New Web Service** on Render.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `cd web && python -m uvicorn app:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**: Ensure `PORT` is set (Render does this automatically).

---

## 💻 Desktop Edition (Legacy)

The original CLI/GUI version using AppleScript for macOS control.

### Usage
1. Install dependencies: `pip install -r requirements.txt`
2. Run: `python main.py`
3. Press **'q'** to quit.

---

## ⚙️ Configuration

Customize behavior in `config.json`:
- `face_position_ratio`: Increase for less sensitivity, decrease for more.
- `roasting.messages`: Add your own motivational insults.
- `camera.preferred_index`: If you have multiple webcams.

## 🛠️ Requirements
- Python 3.10+
- Webcam
- OpenCV
- `rickroll.mp4` (included in `web/static/`)

## 📜 License
Free to use. Stay focused! 💪
