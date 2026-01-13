# Doomscrolling Blocker 📱🚫

A Python program that uses your webcam to detect when you're looking down at your phone (aka doomscrolling) and roasts you to get back to work! Features an automatic rickroll video popup when caught!

## Features

- **Real-time face and eye tracking** using OpenCV
- **Doomscrolling detection** - detects when you tilt your head down
- **Motivational roasting** - displays harsh but motivating messages when caught
- **Rickroll punishment** - automatically plays `rickroll.mp4` when you're doomscrolling
- **Auto-close video** - stops the video when you return to good posture
- **Automatic fallback** - works with dlib or OpenCV Haar Cascades
- **Configurable** - customize detection thresholds, messages, and more via `config.json`
- **Logging** - detailed logs saved to `doomscroll_blocker.log`
- **Auto-recovery** - automatically restarts if camera disconnects

## Installation

### Quick Install

```bash
pip install -r requirements.txt
```

### Manual Install

#### Basic (OpenCV only)

```bash
pip install opencv-python numpy
```

#### Advanced (Better accuracy with dlib)

```bash
pip install opencv-python numpy dlib

# Download the face landmarks model
wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bunzip2 shape_predictor_68_face_landmarks.dat.bz2
```

### Setup

1. Place your `rickroll.mp4` file in the project directory
2. Make sure QuickTime Player (macOS), VLC (Linux), or default video player (Windows) is installed
3. (Optional) Customize `config.json` to your preferences

## Usage

```bash
python main.py
```

- The program will open your webcam
- Look at the screen normally = Green "Good posture!" message
- Look down at your phone = Red warning with roasting messages + **RICKROLL VIDEO AUTOPLAY** 🎵
- Return to good posture = Video automatically closes
- Press **'q'** to quit

## Configuration

Edit `config.json` to customize the behavior:

```json
{
  "camera": {
    "preferred_index": 0,
    "warmup_seconds": 2.0,
    "retry_delay_seconds": 5
  },
  "detection": {
    "threshold_frames": 1,
    "face_position_ratio": 0.58,
    "eye_position_ratio": 0.6
  },
  "roasting": {
    "cooldown_seconds": 3,
    "messages": [
      "Your custom roast messages here!"
    ]
  },
  "rickroll": {
    "video_path": "rickroll.mp4",
    "enabled": true
  }
}
```

## How It Works

1. **Face Detection**: Detects your face using either dlib or OpenCV Haar Cascades
2. **Posture Analysis**: Tracks head tilt and eye position
3. **Doomscroll Detection**: Triggers when:
   - Your head tilts down significantly
   - Your face moves to the lower portion of the frame
   - Your eyes are positioned low in your face region
4. **Roasting**: Displays motivational (harsh) messages every 3 seconds when caught
5. **Rickroll**: Automatically opens and plays `rickroll.mp4` when doomscrolling detected
6. **Auto-stop**: Closes the video when you return to normal posture

## Requirements

- Python 3.13+
- Webcam
- OpenCV (`opencv-python`)
- NumPy
- dlib (optional, for better accuracy)
- QuickTime Player (macOS) or VLC (Linux) or Windows Media Player (Windows)
- `rickroll.mp4` file in project directory

## Troubleshooting

**Video doesn't autoplay on macOS:**
- Make sure QuickTime Player is installed
- The script uses AppleScript to force autoplay
- Check System Settings > Privacy & Security > Automation for terminal permissions

**Video doesn't close automatically:**
- The script sends a kill command to QuickTime Player
- You may need to manually close it if the process detection fails

**Detection is too sensitive/not sensitive enough:**
- Adjust the thresholds in `config.json`
- Change `face_position_ratio` to a higher (less sensitive) or lower (more sensitive) value

**Camera not found:**
- Check logs in `doomscroll_blocker.log`
- Ensure your terminal/IDE has camera permissions (System Settings > Privacy & Security > Camera)
- Try changing `preferred_index` in `config.json`

## License

Free to use. Stay productive! 💪

---

*Inspired by [kristelTech/Doomscrolling_Blocker](https://github.com/kristelTech/Doomscrolling_Blocker)*
