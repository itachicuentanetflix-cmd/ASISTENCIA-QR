// Reconocimiento facial en el navegador (face-api.js). Los modelos se cargan desde jsDelivr.
const V = '1.7.12';
const BASE = `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${V}`;
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
