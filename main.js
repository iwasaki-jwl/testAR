const video = document.getElementById('video'); 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ringImg = new Image();
ringImg.src = "./models/blueR_5784.PNG";

// ===== カメラ制御 =====
let currentStream = null;
let currentFacingMode = "environment"; // 初期は内カメラ

async function startCamera(facingMode) {
  // 既存ストリーム停止
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: facingMode } }
    });
    video.srcObject = stream;
    currentStream = stream;
  } catch (e) {
    // fallback
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode }
    });
    video.srcObject = stream;
    currentStream = stream;
  }
}

// 初期起動
startCamera(currentFacingMode);

// ===== 切り替えボタン =====
const switchBtn = document.createElement("button");
switchBtn.innerText = "カメラ切替";
switchBtn.style.position = "absolute";
switchBtn.style.top = "20px";
switchBtn.style.right = "20px";
switchBtn.style.zIndex = "10";
switchBtn.style.padding = "10px";
document.body.appendChild(switchBtn);

switchBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera(currentFacingMode);
});

// ===== MediaPipe設定 =====
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

// ===== 検出処理 =====
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

    const ringSize = 80;

ctx.drawImage(
  ringImg,
  x - ringSize / 2,
  y - ringSize / 2,
  ringSize,
  ringSize
);
  }
});

// ===== フレーム処理（Cameraクラス使わない版）=====
async function renderLoop() {
  if (video.readyState >= 2) {
    await hands.send({ image: video });
  }
  requestAnimationFrame(renderLoop);
}

renderLoop();
