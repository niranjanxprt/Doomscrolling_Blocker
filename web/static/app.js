let video, canvas, ctx;
let isMonitoring = false;
let detectionCount = 0;
let rickrollPlaying = false;
let detectionInterval;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const detectionCountSpan = document.getElementById('detectionCount');
const rickrollContainer = document.getElementById('rickrollContainer');
const rickrollVideo = document.getElementById('rickrollVideo');

async function initCamera() {
    try {
        video = document.getElementById('webcam');
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
        });

        video.srcObject = stream;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            updateStatus('Ready to start!', 'neutral');
        };
    } catch (error) {
        console.error('Camera error:', error);
        updateStatus('Camera access denied!', 'error');
    }
}

function updateStatus(message, type) {
    statusDiv.className = `status ${type}`;
    statusDiv.querySelector('h2').textContent = message;

    const messages = {
        'good': 'Keep up the good posture!',
        'bad': 'PUT THE PHONE DOWN NOW!',
        'neutral': 'Monitoring your posture...',
        'error': 'Please allow camera access'
    };

    statusDiv.querySelector('p').textContent = messages[type] || '';
}

async function captureAndDetect() {
    if (!isMonitoring) return;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();

        if (result.doomscrolling) {
            detectionCount++;
            detectionCountSpan.textContent = detectionCount;
            updateStatus('Doomscrolling Detected!', 'bad');
            playRickroll();
        } else {
            updateStatus('Good Posture!', 'good');
            stopRickroll();
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}

function playRickroll() {
    if (!rickrollPlaying) {
        rickrollPlaying = true;
        rickrollContainer.classList.remove('hidden');
        rickrollVideo.play();
    }
}

function stopRickroll() {
    if (rickrollPlaying) {
        rickrollPlaying = false;
        rickrollContainer.classList.add('hidden');
        rickrollVideo.pause();
        rickrollVideo.currentTime = 0;
    }
}

function startMonitoring() {
    isMonitoring = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = 'Monitoring';
    updateStatus('Monitoring...', 'neutral');

    // Check every 2 seconds
    detectionInterval = setInterval(captureAndDetect, 2000);
}

function stopMonitoring() {
    isMonitoring = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = 'Stopped';
    updateStatus('Monitoring stopped', 'neutral');
    stopRickroll();

    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
}

startBtn.addEventListener('click', startMonitoring);
stopBtn.addEventListener('click', stopMonitoring);

// Initialize camera on load
initCamera();
