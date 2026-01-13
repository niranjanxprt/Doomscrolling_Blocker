let video, overlayCanvas, overlayCtx, detectionCanvas, detectionCtx;
let isMonitoring = false;
let detectionCount = 0;
let rickrollPlaying = false;
let detectionInterval;
let cooldownActive = false;
let lastDetectionTime = 0;
let consecutiveBadDetections = 0;
const BAD_DETECTION_THRESHOLD = 1; // Immediate trigger for verification (was 2)

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const dismissBtn = document.getElementById('dismissBtn');
const statusCard = document.getElementById('statusCard');
const statusText = document.getElementById('statusText');
const detectionCountSpan = document.getElementById('detectionCount');
const rickrollContainer = document.getElementById('rickrollContainer');
const rickrollVideo = document.getElementById('rickrollVideo');

async function initCamera() {
    try {
        video = document.getElementById('webcam');
        overlayCanvas = document.getElementById('overlayCanvas');
        overlayCtx = overlayCanvas.getContext('2d');
        detectionCanvas = document.getElementById('detectionCanvas');
        detectionCtx = detectionCanvas.getContext('2d');

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;

        video.onloadedmetadata = () => {
            resizeCanvases();
            updateStatus('Ready', 'System online and waiting', 'neutral', '🔍');
        };

        // Fallback for metadata already loaded
        if (video.readyState >= 2) {
            resizeCanvases();
        }
    } catch (error) {
        console.error('Camera error:', error);
        updateStatus('Error', 'Camera access denied', 'bad', '⚠️');
    }
}

function updateStatus(title, desc, type, icon) {
    statusCard.className = `status-card glass ${type}`;
    statusCard.querySelector('h2').textContent = title;
    statusCard.querySelector('p').textContent = desc;
    statusCard.querySelector('.status-icon').textContent = icon;

    statusText.textContent = isMonitoring ? 'Active' : 'Standby';
    statusText.className = `value status-text ${type}`;
}

async function captureAndDetect() {
    if (!isMonitoring || cooldownActive) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        return;
    }

    // Capture frame
    detectionCtx.save();
    detectionCtx.scale(-1, 1);
    detectionCtx.drawImage(video, -detectionCanvas.width, 0, detectionCanvas.width, detectionCanvas.height);
    detectionCtx.restore();

    const imageData = detectionCanvas.toDataURL('image/jpeg', 0.8);

    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();
        console.log('Detection response:', result);

        // Draw detection squares
        drawDetectionBoxes(result.boxes, result.doomscrolling);

        if (result.doomscrolling) {
            consecutiveBadDetections++;
            if (consecutiveBadDetections >= BAD_DETECTION_THRESHOLD) {
                detectionCount++;
                detectionCountSpan.textContent = detectionCount;
                detectionCountSpan.classList.add('pulse');
                setTimeout(() => detectionCountSpan.classList.remove('pulse'), 500);

                updateStatus('Doomscrolling', result.message, 'bad', '🚨');
                playRickroll(result.message);
            } else {
                console.log(`Bad detection: ${consecutiveBadDetections}/${BAD_DETECTION_THRESHOLD}`);
                updateStatus('Suspicious', `Detecting... (${consecutiveBadDetections}/${BAD_DETECTION_THRESHOLD})`, 'neutral', '🧐');
            }
        } else {
            consecutiveBadDetections = 0;
            updateStatus('Focused', result.message || 'Monitoring active...', 'good', '✅');
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}

function resizeCanvases() {
    overlayCanvas.width = video.videoWidth || 640;
    overlayCanvas.height = video.videoHeight || 480;
    detectionCanvas.width = video.videoWidth || 640;
    detectionCanvas.height = video.videoHeight || 480;
}

function drawDetectionBoxes(boxes, isBad) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!boxes || boxes.length === 0) return;

    boxes.forEach(box => {
        const color = isBad ? '#ef4444' : '#10b981';
        overlayCtx.strokeStyle = color;
        overlayCtx.lineWidth = 5; // Thicker lines
        overlayCtx.shadowBlur = 15;
        overlayCtx.shadowColor = color;

        // Draw box (mirrored back because UI is mirrored)
        const x = overlayCanvas.width - box.x - box.w;
        overlayCtx.strokeRect(x, box.y, box.w, box.h);

        // Label
        overlayCtx.fillStyle = color;
        overlayCtx.font = 'bold 12px Outfit';
        overlayCtx.fillText(box.type.toUpperCase(), x, box.y - 5);

        overlayCtx.shadowBlur = 0;
    });
}

function playRickroll(message) {
    if (!rickrollPlaying && !cooldownActive) {
        rickrollPlaying = true;
        if (message) {
            rickrollContainer.querySelector('h1').textContent = message;
        }
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

function dismissRickroll() {
    stopRickroll();
    cooldownActive = true;
    updateStatus('Cooldown', 'Focus session resumed', 'neutral', '⏳');

    // 10 second cooldown
    setTimeout(() => {
        cooldownActive = false;
        if (isMonitoring) {
            updateStatus('Focused', 'Monitoring resumed', 'good', '✅');
        }
    }, 10000);
}

function startMonitoring() {
    isMonitoring = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    updateStatus('Monitoring', 'Session in progress', 'good', '👁️');
    detectionInterval = setInterval(captureAndDetect, 1500); // 1.5s interval
}

function stopMonitoring() {
    isMonitoring = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    updateStatus('Standby', 'Monitoring stopped', 'neutral', '💤');
    stopRickroll();

    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
}

startBtn.addEventListener('click', startMonitoring);
stopBtn.addEventListener('click', stopMonitoring);
dismissBtn.addEventListener('click', dismissRickroll);

// Initialize
initCamera();
