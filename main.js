const video = document.getElementById('video'); 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ===== カメラ =====
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
});

// ===== リング画像 =====
const ringImages = {
  blue: new Image(),
  orange: new Image()
};

ringImages.blue.src = "models/blueR_5784.png";
ringImages.orange.src = "models/orangeR_5785.png";

let currentRing = ringImages.blue;

// ===== 切替ボタン =====
const ringBtn = document.createElement("button");
ringBtn.innerText = "リング切替";
ringBtn.style.position = "absolute";
ringBtn.style.bottom = "20px";
ringBtn.style.left = "20px";
ringBtn.style.zIndex = "10";
ringBtn.style.padding = "10px";
document.body.appendChild(ringBtn);

ringBtn.addEventListener("click", () => {
  currentRing = currentRing === ringImages.blue
    ? ringImages.orange
    : ringImages.blue;
});

// ===== MediaPipe =====
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ===== 描画 =====
hands.onResults(results => {
  if (!video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    const p13 = landmarks[13];
    const p14 = landmarks[14];

    const x = (p13.x + p14.x) / 2 * canvas.width;
    const y = (p13.y + p14.y) / 2 * canvas.height;

    // ===== サイズを指に合わせる =====
    const dx = p13.x - p14.x;
    const dy = p13.y - p14.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const size = distance * canvas.width * 2;

    // ===== 画像描画 =====
    if (currentRing.complete) {
      ctx.drawImage(
        currentRing,
        x - size / 2,
        y - size / 2,
        size,
        size
      );
    }
  }
});

// ===== ループ =====
async function renderLoop() {
  if (video.readyState >= 2) {
    await hands.send({ image: video });
  }
  requestAnimationFrame(renderLoop);
}

renderLoop();
