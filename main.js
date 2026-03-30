const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// カメラ起動
navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment"}
 }).then(stream => {
  video.srcObject = stream;
});

// MediaPipe設定
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

// 検出結果
hands.onResults(results => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // 薬指の関節（13と14）
    const p13 = landmarks[13];
    const p14 = landmarks[14];

    const x = (p13.x + p14.x) / 2 * canvas.width;
    const y = (p13.y + p14.y) / 2 * canvas.height;

    // 仮リング描画（円）
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
});

// カメラと連携
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();