// Reconocimiento facial en el navegador (face-api.js). Los modelos se descargan una vez y quedan en caché.
const BASE = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12';
let p;
export function loadFace() {
  if (p) return p;
  p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${BASE}/dist/face-api.js`;
    s.onload = async () => {
      try {
        const f = window.faceapi; const M = `${BASE}/model/`;
        await Promise.all([f.nets.tinyFaceDetector.loadFromUri(M), f.nets.faceLandmark68TinyNet.loadFromUri(M), f.nets.faceRecognitionNet.loadFromUri(M)]);
        resolve(f);
      } catch (e) { p = null; reject(e); }
    };
    s.onerror = () => { p = null; reject(new Error('Sin conexión al modelo facial')); };
    document.head.appendChild(s);
  });
  return p;
}
export const preloadFace = () => loadFace().catch(() => {});
export const opts = (f) => new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
// Recorta un retrato cuadrado del video alrededor del rostro (JPEG pequeño)
export function cropPhoto(video, box) {
  const vw = video.videoWidth, vh = video.videoHeight;
  const size = Math.min(Math.max(box.width, box.height) * 1.75, vw, vh);
  const sx = Math.min(Math.max(box.x + box.width / 2 - size / 2, 0), vw - size);
  const sy = Math.min(Math.max(box.y + box.height / 2 - size * 0.52, 0), vh - size);
  const c = document.createElement('canvas'); c.width = c.height = 220;
  c.getContext('2d').drawImage(video, sx, sy, size, size, 0, 0, 220, 220);
  return c.toDataURL('image/jpeg', 0.8);
}
