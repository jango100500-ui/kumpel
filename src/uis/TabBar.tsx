import React, { useEffect, useRef } from 'react';

interface TabBarProps {
  activeTab: 'main' | 'exchange';
  onChange: (tab: 'main' | 'exchange') => void;
}

const PHYSICS = {
  pos: { k: 380, d: 38, m: 1 },
  scale: { k: 420, d: 24, m: 1 },
};

function spring(current: number, target: number, velocity: number, config: typeof PHYSICS.pos) {
  const force = -config.k * (current - target);
  const damping = -config.d * velocity;
  const acceleration = (force + damping) / config.m;
  velocity += acceleration * 0.016;
  current += velocity * 0.016;
  return [current, velocity];
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  const state = useRef({
    x: 0, tx: 0, vx: 0,
    w: 0, tw: 0, vw: 0,
    sx: 1, tsx: 1, vsx: 0,
    sy: 1, tsy: 1, vsy: 0,
    isMoving: false,
    intensity: 1,
  });

  const rafId = useRef<number>();

  useEffect(() => {
    const update = () => {
      const s = state.current;
      const dist = Math.abs(s.x - s.tx);
      const vel = Math.abs(s.vx);

      if (s.isMoving) {
        if (dist > 15) {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundColor = 'transparent';
            sliderRef.current.style.borderColor = 'rgba(255,255,255,0.2)';
          }
          s.tsy = 1 + 0.27 * s.intensity;
          s.tsx = 1 - 0.10 * s.intensity;
        } else if (dist <= 15 && dist > 0.5) {
          if (sliderRef.current) {
            sliderRef.current.style.backgroundColor = '';
            sliderRef.current.style.borderColor = 'transparent';
          }
          s.tsy = 1 - 0.05 * s.intensity;
          s.tsx = 1 + 0.08 * s.intensity;
        } else {
          s.tsx = 1;
          s.tsy = 1;
          if (vel < 0.2 && Math.abs(s.vsx) < 0.2) {
            s.isMoving = false;
            if (sliderRef.current) {
              sliderRef.current.style.backgroundColor = '';
              sliderRef.current.style.borderColor = 'transparent';
            }
          }
        }
      }

      [s.x, s.vx] = spring(s.x, s.tx, s.vx, PHYSICS.pos);
      [s.w, s.vw] = spring(s.w, s.tw, s.vw, PHYSICS.pos);
      [s.sx, s.vsx] = spring(s.sx, s.tsx, s.vsx, PHYSICS.scale);
      [s.sy, s.vsy] = spring(s.sy, s.tsy, s.vsy, PHYSICS.scale);

      if (sliderRef.current) {
        sliderRef.current.style.transform = `translateX(${s.x}px) scale(${s.sx}, ${s.sy})`;
        sliderRef.current.style.width = `${s.w}px`;
      }

      rafId.current = requestAnimationFrame(update);
    };

    rafId.current = requestAnimationFrame(update);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    const idx = activeTab === 'main' ? 0 : 1;
    const el = tabsRef.current[idx];
    
    if (el) {
      // Сужаем каплю внутри кнопки (минус 16px ширины, смещение +8px вправо)
      state.current.tw = el.offsetWidth - 16;
      state.current.tx = el.offsetLeft + 8;
      
      if (state.current.w === 0) {
        state.current.x = state.current.tx;
        state.current.w = state.current.tw;
      } else {
        state.current.intensity = 1;
        state.current.isMoving = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      }
    }
  }, [activeTab]);

  return (
    <div className="w-[210px] mx-auto h-[64px] bg-black/10 border border-white/[0.16] backdrop-blur-md rounded-full p-1.5 flex shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative">
      <div
        ref={sliderRef}
        className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-white/20 border border-transparent z-0 pointer-events-none origin-center will-change-transform transition-colors duration-150"
      />
      
      <button
        ref={(el) => (tabsRef.current[0] = el)}
        onClick={() => onChange('main')}
        className="flex-1 flex flex-col items-center justify-center relative z-10 outline-none tap-highlight-transparent"
      >
        <img 
          src={activeTab === 'main' ? '/walletf.png' : '/walletu.png'} 
          alt="Wallet" 
          className={`w-[22px] h-[22px] object-contain transition-transform duration-200 mb-0.5 brightness-0 invert ${
            activeTab === 'main' ? 'scale-110 opacity-100' : 'opacity-60'
          }`}
        />
        <span className={`text-[10px] font-semibold transition-colors duration-200 ${
          activeTab === 'main' ? 'text-white' : 'text-white/60'
        }`}>
          Кошелек
        </span>
      </button>

      <button
        ref={(el) => (tabsRef.current[1] = el)}
        onClick={() => onChange('exchange')}
        className="flex-1 flex flex-col items-center justify-center relative z-10 outline-none tap-highlight-transparent"
      >
        <img 
          src={activeTab === 'exchange' ? '/birgef.png' : '/birgeu.png'} 
          alt="Exchange" 
          className={`w-[22px] h-[22px] object-contain transition-transform duration-200 mb-0.5 brightness-0 invert ${
            activeTab === 'exchange' ? 'scale-110 opacity-100' : 'opacity-60'
          }`}
        />
        <span className={`text-[10px] font-semibold transition-colors duration-200 ${
          activeTab === 'exchange' ? 'text-white' : 'text-white/60'
        }`}>
          Биржа
        </span>
      </button>
    </div>
  );
};
