import { useEffect, useRef, useState } from 'react';

export const useOrientation = (intensity: number = 20) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const baseline = useRef<{ beta: number; gamma: number } | null>(null);
  const rafId = useRef<number>();

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      if (!baseline.current) {
        baseline.current = {
          beta: e.beta,
          gamma: e.gamma,
        };
      }

      const deltaX = e.gamma - baseline.current.gamma;
      const deltaY = e.beta - baseline.current.beta;

      const clampedX = Math.max(-25, Math.min(25, deltaX));
      const clampedY = Math.max(-25, Math.min(25, deltaY));

      target.current = {
        x: (clampedX / 25) * intensity,
        y: (clampedY / 25) * intensity,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const normX = (e.clientX / innerWidth - 0.5) * 2;
      const normY = (e.clientY / innerHeight - 0.5) * 2;

      target.current = {
        x: normX * intensity,
        y: normY * intensity,
      };
    };

    const enableSensors = async () => {
      const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceOrientation?.requestPermission === 'function') {
        try {
          const res = await DeviceOrientation.requestPermission();
          if (res === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    window.addEventListener('touchstart', enableSensors, { once: true, passive: true });
    window.addEventListener('click', enableSensors, { once: true, passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const loop = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;

      setOffset({
        x: current.current.x,
        y: current.current.y,
      });

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('touchstart', enableSensors);
      window.removeEventListener('click', enableSensors);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [intensity]);

  return offset;
};
