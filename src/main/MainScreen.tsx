import React, { useRef, useEffect, useState } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';

interface Transaction {
  id: string;
  name: string;
  type: string;
  amount: string;
  isPositive: boolean;
  date: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', name: 'Алексей', type: 'Перевод', amount: '+500 ₽', isPositive: true, date: 'Вчера, 14:20' },
  { id: '2', name: 'Максим', type: 'Перевод', amount: '-250 ₽', isPositive: false, date: '06.08' },
  { id: '3', name: 'Дмитрий', type: 'Перевод', amount: '+1 200 ₽', isPositive: true, date: '04.08' },
  { id: '4', name: 'Иван', type: 'Перевод', amount: '-400 ₽', isPositive: false, date: '02.08' },
  { id: '5', name: 'Сергей', type: 'Перевод', amount: '+2 500 ₽', isPositive: true, date: '29.07' },
  { id: '6', name: 'Артем', type: 'Перевод', amount: '-150 ₽', isPositive: false, date: '25.07' },
  { id: '7', name: 'Владислав', type: 'Перевод', amount: '+800 ₽', isPositive: true, date: '21.07' },
  { id: '8', name: 'Никита', type: 'Перевод', amount: '-600 ₽', isPositive: false, date: '18.07' },
];

const MIN_Y = 56;
const MAX_Y = 380;

const AnimatedDigit: React.FC<{ value: string }> = ({ value }) => {
  const [current, setCurrent] = useState(value);
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    if (value !== current) {
      setPrev(current);
      setCurrent(value);
      const t = setTimeout(() => setPrev(null), 350);
      return () => clearTimeout(t);
    }
  }, [value, current]);

  return (
    <span className="relative inline-flex flex-col items-center justify-center overflow-hidden h-[1em]">
      {prev !== null && <span className="absolute inset-x-0 text-center digit-exit">{prev}</span>}
      <span key={current} className="absolute inset-x-0 text-center digit-enter">{current}</span>
      <span className="invisible">{current}</span>
    </span>
  );
};

export const MainScreen: React.FC = () => {
  const tilt = useOrientation(22);

  const sheetRef = useRef<HTMLDivElement>(null);
  const topContentRef = useRef<HTMLDivElement>(null);
  
  const currentY = useRef(MAX_Y);
  const targetY = useRef(MAX_Y);
  const isDraggingSheet = useRef(false);
  const dragStartY = useRef(0);
  const startDragY = useRef(0);
  const rafId = useRef<number>();

  const flipTimeoutRef = useRef<NodeJS.Timeout>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: '0', h: '0', m: '0' });

  // Таймер обратного отсчета
  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    const targetTime = target.getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)).toString(),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString(),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCardPointerDown = () => {
    flipTimeoutRef.current = setTimeout(() => {
      setIsFlipped((prev) => !prev);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); // Тактильный отклик iOS
      }
    }, 550);
  };

  const handleCardPointerCancel = () => {
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
  };

  // Механика модального окна
  const updateDOM = (y: number) => {
    if (!sheetRef.current || !topContentRef.current) return;
    const clampedY = Math.max(MIN_Y, Math.min(MAX_Y, y));
    const progress = (clampedY - MIN_Y) / (MAX_Y - MIN_Y);

    sheetRef.current.style.transform = `translate3d(0, ${y - MIN_Y}px, 0)`;

    const scale = 0.92 + 0.08 * progress;
    const translateY = -15 * (1 - progress);
    const opacity = 0.2 + 0.8 * progress;
    const blur = 4 * (1 - progress);

    topContentRef.current.style.transform = `scale(${scale}) translate3d(0, ${translateY}px, 0)`;
    topContentRef.current.style.opacity = `${opacity}`;
    topContentRef.current.style.filter = `blur(${blur}px)`;
  };

  const smoothSnap = () => {
    if (isDraggingSheet.current) return;
    const diff = targetY.current - currentY.current;
    currentY.current += diff * 0.16;
    updateDOM(currentY.current);

    if (Math.abs(diff) > 0.5) {
      rafId.current = requestAnimationFrame(smoothSnap);
    } else {
      currentY.current = targetY.current;
      updateDOM(currentY.current);
    }
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSheet.current = true;
    dragStartY.current = e.clientY;
    startDragY.current = currentY.current;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet.current) return;
    const delta = e.clientY - dragStartY.current;
    let newY = startDragY.current + delta;
    if (newY < MIN_Y) {
      const overshoot = MIN_Y - newY;
      newY = MIN_Y - overshoot * 0.3;
    }
    currentY.current = newY;
    updateDOM(newY);
  };

  const handleSheetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet.current) return;
    isDraggingSheet.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const velocity = e.clientY - dragStartY.current;
    if (velocity < -20) targetY.current = MIN_Y;
    else if (velocity > 20) targetY.current = MAX_Y;
    else targetY.current = currentY.current < (MAX_Y + MIN_Y) / 2 ? MIN_Y : MAX_Y;
    
    rafId.current = requestAnimationFrame(smoothSnap);
  };

  useEffect(() => {
    updateDOM(MAX_Y);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      handleCardPointerCancel();
    };
  }, []);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[#5491D0] select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: 'url(/background2.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div
        ref={topContentRef}
        className="relative z-10 w-full px-5 pt-3 pb-3 flex flex-col items-center flex-shrink-0 origin-top will-change-transform"
      >
        <div className="w-full flex justify-end mb-2.5">
          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <img
              src="/edit.png"
              alt="Edit"
              className="w-5 h-5 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
          </JellyButton>
        </div>

        <div
          className="perspective-1000 w-full max-w-[340px] cursor-pointer"
          onPointerDown={handleCardPointerDown}
          onPointerUp={handleCardPointerCancel}
          onPointerLeave={handleCardPointerCancel}
          onPointerCancel={handleCardPointerCancel}
        >
          <div
            className={`relative w-full aspect-[1.75/1] transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute inset-0 backface-hidden bg-[#E33125] rounded-[24px] p-5 flex flex-col justify-between shadow-lg">
              <div className="w-full flex justify-start items-start">
                <span className="text-[#19181F] text-[17px] font-semibold tracking-wide">
                  Kumpel
                </span>
              </div>
              <div className="w-full flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[#19181F] text-[28px] font-bold tracking-tight leading-none mb-1">
                    500₽
                  </span>
                  <span className="text-[#19181F] text-[15px] font-medium tracking-widest opacity-80">
                    ***5678
                  </span>
                </div>
                <img
                  src="/logo.png"
                  alt="Bank Logo"
                  className="w-10 h-10 object-contain brightness-0 opacity-90 pointer-events-none"
                />
              </div>
            </div>

            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#E33125] rounded-[24px] p-5 flex flex-col items-center justify-center shadow-lg">
              <span className="text-[#19181F] text-[14px] font-semibold opacity-75 mb-1.5">
                До еженедельного пополнения:
              </span>
              <div className="flex items-baseline text-[#19181F] text-[34px] font-bold tracking-tight gap-1.5 leading-none">
                <div className="flex items-baseline"><AnimatedDigit value={timeLeft.d} /><span className="text-[18px] ml-0.5 opacity-90">д</span></div>
                <div className="flex items-baseline"><AnimatedDigit value={timeLeft.h} /><span className="text-[18px] ml-0.5 opacity-90">ч</span></div>
                <div className="flex items-baseline"><AnimatedDigit value={timeLeft.m} /><span className="text-[18px] ml-0.5 opacity-90">м</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[340px] flex gap-3 mt-3.5">
          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center gap-2"
          >
            <img
              src="/share.png"
              alt="Share"
              className="w-4 h-4 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
            <span className="text-white/90 text-[15px] font-medium tracking-wide">
              Перевод
            </span>
          </JellyButton>

          <JellyButton
            type="button"
            flashColor="bg-white/15"
            className="flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center gap-2"
          >
            <img
              src="/request.png"
              alt="Request"
              className="w-4 h-4 object-contain brightness-0 invert opacity-75 pointer-events-none"
            />
            <span className="text-white/90 text-[15px] font-medium tracking-wide">
              Запросить
            </span>
          </JellyButton>
        </div>
      </div>

      <div
        ref={sheetRef}
        className="absolute inset-x-0 z-20 bg-white rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `${MIN_Y}px`,
          height: `calc(100dvh - ${MIN_Y}px)`,
        }}
      >
        <div
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
          className="w-full pt-3 pb-3 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
        >
          <div className="w-9 h-1.5 rounded-full bg-black/15 pointer-events-none" />
          <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight mt-3 text-center pointer-events-none">
            История переводов
          </p>
        </div>

        <div className="w-full max-w-[340px] px-2 pb-8 flex-1 overflow-y-auto scroll-y-touch flex flex-col gap-2.5">
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="w-full h-14 px-3.5 rounded-full bg-black/[0.04] border border-black/[0.04] flex items-center justify-between flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/[0.05] flex items-center justify-center flex-shrink-0">
                  <img
                    src="/transfer.png"
                    alt="Transfer"
                    className="w-4 h-4 object-contain brightness-0 opacity-80 pointer-events-none"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-black text-[14px] font-semibold tracking-tight leading-tight">
                    {tx.name}
                  </span>
                  <span className="text-[#8E8E93] text-[11px] font-normal leading-tight">
                    {tx.type}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-black text-[14px] font-semibold tracking-tight leading-tight">
                  {tx.amount}
                </span>
                <span className="text-[#8E8E93] text-[11px] font-normal leading-tight">
                  {tx.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
