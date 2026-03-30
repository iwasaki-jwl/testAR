const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// =======================
// カメラ起動（外カメラ）
// =======================
async function startCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  const backCamera = videoDevices.find(d =>
    d.label.toLowerCase().includes('back') ||
    d.label.toLowerCase().includes('environment')
  );

  const stream = await navigator.mediaDevices.getUserMedia({
    video: backCamera
      ? { deviceId: { exact: backCamera.deviceId } }
      : { facingMode: { exact: "environment" } }
  });

  video.srcObject = stream;
}
startCamera();

// =======================
// Three.js 初期化
// =======================
const scene = new THREE.Scene();

const camera3D = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.01, 10);
camera3D.position.z = 2;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "three-canvas";
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "3";
document.body.appendChild(renderer.domElement);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 2);
scene.add(light);

// =======================
// OBJ + MTLロード
// =======================
let ring = null;

const mtlLoader = new THREE.MTLLoader();
mtlLoader.load('models/ring.mtl', (materials) => {
  materials.preload();

  const objLoader = new THREE.OBJLoader();
  objLoader.setMaterials(materials);

  objLoader.load('models/ring.obj', (obj) => {
    ring = obj;

    // 初期スケールと位置
    ring.scale.set(0.05, 0.05, 0.05);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0, -0.5);

    scene.add(ring);
    console.log("リング読み込み成功");
  });
});

// =======================
// MediaPipe設定
// =======================
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

// =======================
// 検出結果処理
// =======================
hands.onResults(results => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks.length > 0 && ring) {
    const landmarks = results.multiHandLandmarks[0];
    const p13 = landmarks[13];
    const p14 = landmarks[14];

    // 中点
    const x = (p13.x + p14.x) / 2;
    const y = (p13.y + p14.y) / 2;

    // Three.js座標変換
    const posX = (x - 0.5) * 2;
    const posY = -(y - 0.5) * 2;

    ring.position.set(posX, posY, -0.5);

    // 回転
    const dx = p14.x - p13.x;
    const dy = p14.y - p13.y;
    const angle = Math.atan2(dy, dx);
    ring.rotation.z = -angle;

    // スケール
    const dist = Math.hypot(dx, dy);
    const scale = dist * 6;
    ring.scale.set(scale, scale, scale);
  }
});

// =======================
// MediaPipeカメラ連携
// =======================
const cameraMP = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
cameraMP.start();

// =======================
// 描画ループ
// =======================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera3D);
}
animate();
