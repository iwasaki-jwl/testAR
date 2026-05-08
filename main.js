const video = document.getElementById('video'); 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const blueRingImg = new Image();
blueRingImg.src = "./models/blueR_5784.PNG";


const orangeRingImg = new Image();
orangeRingImg.src = "./models/orangeR_5785.PNG";

// 現在選択中のリング
let currentRingImg = blueRingImg;

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

// ===== リング選択ボタン =====

// ボタンを入れる箱
const ringSelector = document.createElement("div");

ringSelector.style.position = "absolute";
ringSelector.style.bottom = "20px";
ringSelector.style.left = "50%";
ringSelector.style.transform = "translateX(-50%)";
ringSelector.style.display = "flex";
ringSelector.style.gap = "10px";
ringSelector.style.zIndex = "10";

document.body.appendChild(ringSelector);

// ① 青リングボタン
const blueBtn = document.createElement("button");
blueBtn.innerText = "①";
blueBtn.style.padding = "10px";

blueBtn.addEventListener("click", () => {
  currentRingImg = blueRingImg;
});

ringSelector.appendChild(blueBtn);

// ② オレンジリングボタン
const orangeBtn = document.createElement("button");
orangeBtn.innerText = "②";
orangeBtn.style.padding = "10px";

orangeBtn.addEventListener("click", () => {
  currentRingImg = orangeRingImg;
});

ringSelector.appendChild(orangeBtn);

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

    const dx = p14.x - p13.x;
    const dy = p14.y - p13.y;
    
    const angle = Math.atan2(dy, dx);

    const ringSize = 40;

ctx.save();

ctx.translate(x, y);

ctx.rotate(angle + Math.PI / 2);

ctx.drawImage(
  currentRingImg,
  -ringSize / 2,
  -ringSize / 2,
  ringSize,
  ringSize
);

ctx.restore();
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
