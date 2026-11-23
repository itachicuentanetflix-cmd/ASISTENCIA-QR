'use client';
import { useCallback, useEffect, useRef } from 'react';
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const start = useCallback(async (facing = 'environment') => {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('La cámara requiere HTTPS');
    const s = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
    });
    streamRef.current = s;
    const v = videoRef.current;
    v.setAttribute('playsinline', 'true'); v.muted = true; v.srcObject = s;
    await v.play();
  }, [stop]);
  useEffect(() => stop, [stop]);
  return { videoRef, start, stop };
}
