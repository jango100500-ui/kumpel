import React, { useEffect, useRef, useState } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';

interface ExchangeScreenProps {
  currentBgImage: string;
  marketData: {
    rate: number;
    history: Array<{ date: string; rate: number }>;
  };
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

const Timeframes = ['1Д', '7Д', '1М', '3М', 'ВСЕ'];

const TimeframeSelector: React.FC<{ activeTab: number; onChange: (i: number) => void }> = ({ activeTab, onChange }) => {
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
            sliderRef.current.style.borderColor = 'rgba(142,142,147,0.3)';
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
    const el = tabsRef.current[activeTab];
    if (el) {
      state.current.tx = el.offsetLeft + 2;
      state.current.tw = el.offsetWidth - 4;

      if (state.current.w === 0) {
        state.current.x = state.current.tx;
        state.current.w = state.current.tw;
        if (sliderRef.current) {
          sliderRef.current.style.transform = `translateX(${state.current.x}px) scale(1, 1)`;
          sliderRef.current.style.width = `${state.current.w}px`;
        }
      } else {
        state.current.intensity = 1;
        state.current.isMoving = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      }
    }
  }, [activeTab]);

  return (
    <div className="w-full h-[38px] bg-black/5 dark:bg-white/5 rounded-full flex relative p-[3px] border border-black/5 dark:border-white/5 shadow-inner">
      <div
        ref={sliderRef}
        className="absolute top-[3px] bottom-[3px] left-0 rounded-full bg-white dark:bg-[#2C2C2E] border border-transparent z-0 pointer-events-none origin-center will-change-transform shadow-sm transition-colors duration-150"
      />
      {Timeframes.map((tf, i) => (
        <button
          key={tf}
          ref={(el) => (tabsRef.current[i] = el)}
          onClick={() => onChange(i)}
          className="flex-1 relative z-10 flex items-center justify-center outline-none tap-highlight-transparent"
        >
          <span
            className={`text-[12px] font-bold transition-colors duration-200 ${
              activeTab === i ? 'text-black dark:text-white' : 'text-[#8E8E93]'
            }`}
          >
            {tf}
          </span>
        </button>
      ))}
    </div>
  );
};

export const ExchangeScreen: React.FC<ExchangeScreenProps> = ({ currentBgImage, marketData }) => {
  const tilt = useOrientation(22);
  const [selectedTf, setSelectedTf] = useState(4);

  const currentRate = marketData.rate || 1.0;
  const usdRate = Math.max(0.01, Math.round((currentRate / 95) * 100) / 100);

  const renderChart = () => {
    if (!marketData.history || marketData.history.length < 2) {
      return (
        <div className="w-full h-full flex items-center justify-center text-center px-4">
          <span className="text-[#8E8E93] text-[12px] font-medium leading-relaxed">
            Здесь скоро будет статистика<br />(накапливаем историю)
          </span>
        </div>
      );
    }

    const rates = marketData.history.map((h) => h.rate);
    const min = Math.min(...rates) * 0.95;
    const max = Math.max(...rates) * 1.05;
    const range = Math.max(0.1, max - min);

    const points = rates.map((r, idx) => {
      const x = (idx / (rates.length - 1)) * 100;
      const y = 45 - ((r - min) / range) * 35;
      return `${x},${y}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `M 0,50 L ${points.join(' L ')} L 100,50 Z`;

    return (
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34C759" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34C759" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chart-grad)" />
        <path d={linePath} fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden flex flex-col select-none bg-transparent">
      <div
        className="absolute inset-[-100px] bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.25)`,
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center px-5 pt-[66px] pb-[110px]">
        <div className="flex-shrink-0 w-full max-w-[340px] bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-[24px] rounded-[24px] shadow-lg border border-white/40 dark:border-white/10 p-4 flex justify-between items-center mb-3">
          <div className="flex flex-col flex-1">
            <span className="text-[12px] font-semibold text-[#8E8E93] mb-0.5">Курс ₭:</span>
            <span className="text-[22px] font-bold text-black dark:text-white leading-tight">
              {currentRate.toFixed(2)} ₽
            </span>
            <span className="text-[11px] font-bold text-[#34C759] tracking-tight mt-0.5">
              ▲ +12% за неделю
            </span>
          </div>

          <div className="w-[1px] h-12 bg-black/10 dark:bg-white/10 mx-3 rounded-full" />

          <div className="flex flex-col flex-1 items-end text-right">
            <span className="text-[12px] font-semibold text-[#8E8E93] mb-0.5">Курс ₭:</span>
            <span className="text-[22px] font-bold text-black dark:text-white leading-tight">
              {usdRate} $
            </span>
            <span className="text-[11px] font-bold text-[#34C759] tracking-tight mt-0.5">
              ▲ +12% за неделю
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 w-full max-w-[340px] bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-[24px] rounded-[28px] shadow-lg border border-white/40 dark:border-white/10 p-4 flex flex-col mb-3">
          <div className="w-full h-[140px] relative mb-4 flex items-end">
            {renderChart()}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10 py-1">
              <div className="w-full border-b border-dashed border-black dark:border-white" />
              <div className="w-full border-b border-dashed border-black dark:border-white" />
              <div className="w-full border-b border-dashed border-black dark:border-white" />
              <div className="w-full border-b border-dashed border-black dark:border-white" />
            </div>
          </div>
          <TimeframeSelector activeTab={selectedTf} onChange={setSelectedTf} />
        </div>

        <div className="flex-1 w-full max-w-[340px] bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-[24px] border border-white/40 dark:border-white/10 rounded-[32px] pt-3 shadow-lg flex flex-col items-center min-h-0">
          <div className="flex-shrink-0 w-9 h-1.5 rounded-full bg-black/20 dark:bg-white/20 pointer-events-none mb-3" />
          <span className="flex-shrink-0 text-[#8E8E93] text-[13px] font-medium tracking-tight mb-4">
            История курса
          </span>

          <div className="flex-1 w-full px-2 pb-4 overflow-y-auto scroll-y-touch flex flex-col gap-2.5">
            {marketData.history.length === 0 ? (
              <div className="w-full flex-1 flex items-center justify-center py-6 text-center">
                <span className="text-[#8E8E93] text-[13px] font-medium">
                  История курса формируется
                </span>
              </div>
            ) : (
              marketData.history.slice().reverse().map((item, idx) => (
                <div
                  key={`${item.date}-${idx}`}
                  className="w-full h-[52px] px-4 rounded-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm flex items-center justify-between flex-shrink-0"
                >
                  <div className="flex flex-col">
                    <span className="text-black dark:text-white text-[13px] font-semibold tracking-tight leading-tight mb-0.5">
                      {item.date}
                    </span>
                    <span className="text-[#8E8E93] text-[11px] font-medium leading-tight">
                      Фиксация суток
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-black dark:text-white text-[14px] font-bold tracking-tight leading-tight">
                        {item.rate.toFixed(2)} ₽
                      </span>
                      <span className="text-[#8E8E93] text-[12px] font-semibold leading-tight opacity-75">
                        ({(item.rate / 95).toFixed(2)} $)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold leading-tight text-[#34C759]">
                      ▲ Торги 00:00
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
