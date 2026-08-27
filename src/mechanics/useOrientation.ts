import { useEffect, useRef, useState } from 'react';

export const useOrientation = (intensity: number = 15) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number>();
  const permissionRequested = useRef(false);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;

      const clampedGamma = Math.max(-45, Math.min(45, gamma));
      const clampedBeta = Math.max(-45, Math.min(45, beta));

      targetOffset.current = {
        x: (clampedGamma / 45) * intensity,
        y: (clampedBeta / 45) * intensity,
      };
    };

    const requestAndListen = async () => {
      if (permissionRequested.current) return;
      permissionRequested.current = true;

      const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceOrientationEventAny?.requestPermission === 'function') {
        try {
          const response = await DeviceOrientationEventAny.requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    const handleFirstTouch = () => {
      requestAndListen();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });

    const smoothUpdate = () => {
      currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * 0.08;
      currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * 0.08;

      setOffset({
        x: currentOffset.current.x,
        y: currentOffset.current.y,
      });

      animationFrameId.current = requestAnimationFrame(smoothUpdate);
    };

    animationFrameId.current = requestAnimationFrame(smoothUpdate);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [intensity]);

  return offset;
};
