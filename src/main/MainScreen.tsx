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

type CardStyle = {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  accentColor: string;
  isGlass?: boolean;
};

const cardStyles: CardStyle[] = [
  { id: 'classic', name: 'Классика', bgClass: 'bg-[#E33125]', textClass: 'text-[#19181F]', accentColor: '#E33125' },
  { id: 'dark', name: 'Темный', bgClass: 'bg-[#1C1C1E]', textClass: 'text-white', accentColor: '#1C1C1E' },
  { id: 'honey', name: 'Медовый', bgClass: 'bg-[#E5A93C]', textClass: 'text-[#19181F]', accentColor: '#E5A93C' },
  { id: 'coffee', name: 'Кофейный', bgClass: 'bg-[#4A3B32]', textClass: 'text-white', accentColor: '#4A3B32' },
  { id: 'vanilla', name: 'Ванильный', bgClass: 'bg-[#F3E5AB]', textClass: 'text-[#19181F]', accentColor: '#D4C381' },
  { id: 'glass', name: 'Стеклянный', bgClass: 'bg-white/20 border border-white/30 backdrop-blur-xl', textClass: 'text-white', accentColor: '#8E8E93', isGlass: true },
];

const MIN_Y = 56;
const MAX_Y = 380;
const AUTH_TRANSITION = 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1), opacity 450ms cubic-bezier(0.32, 0.72, 0, 1)';

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

const EMVChip: React.FC = () => (
  <div className="w-10 h-[28px] rounded-md bg-gradient-to-br from-[#E6C27A] via-[#FFD700] to-[#D4AF37] border border-[#B8860B]/50 relative overflow-hidden flex items-center justify-center shadow-sm opacity-90">
    <div className="absolute inset-x-0 top-1/4 h-[0.5px] bg-[#8B6508]/40" />
    <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-[#8B6508]/40" />
    <div className="absolute inset-x-0 top-3/4 h-[0.5px] bg-[#8B6508]/40" />
    <div className="absolute inset-y-0 left-1/4 w-[0.5px] bg-[#8B6508]/40" />
    <div className="absolute inset-y-0 right-1/4 w-[0.5px] bg-[#8B6508]/40" />
    <div className="w-3.5 h-4 rounded-full border-[0.5px] border-[#8B6508]/40" />
  </div>
);

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

  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: '0', h: '0', m: '0' });

  const [isEditMode, setIsEditMode] = useState(false);
  
  const [savedStyleId, setSavedStyleId] = useState('classic');
  const [savedShowChip, setSavedShowChip] = useState(false);

  const [tempStyleId, setTempStyleId] = useState('classic');
  const [tempShowChip, setTempShowChip] = useState(false);

  const activeStyle = cardStyles.find((s) => s.id === (isEditMode ? tempStyleId : savedStyleId)) || cardStyles[0];
  const activeShowChip = isEditMode ? tempShowChip : savedShowChip;

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
    if (isEditMode) return;
    flipTimeoutRef.current = setTimeout(() => {
      setIsFlipped((prev) => !prev);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 550);
  };

  const handleCardPointerCancel = () => {
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
  };

  const updateDOM = (y: number) => {
    if (!sheetRef.current || !topContentRef.current) return;
    const clampedY = Math.max(MIN_Y, Math.min(MAX_Y, y));
    const progress = (clampedY - MIN_Y) / (MAX_Y - MIN_Y);

    if (!isEditMode) {
      sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    const scale = 0.92 + 0.08 * progress;
    const translateY = -15 * (1 - progress);
    const opacity = 0.2 + 0.8 * progress;
    const blurAmount = 4 * (1 - progress);

    topContentRef.current.style.transform = `scale(${scale}) translate3d(0, ${translateY}px, 0)`;
    topContentRef.current.style.opacity = `${opacity}`;
    
    // Исправление пропадания эффекта стекла: выключаем filter у родителя, если блюр не нужен.
    topContentRef.current.style.filter = blurAmount > 0.1 ? `blur(${blurAmount}px)` : 'none';
  };

  const smoothSnap = () => {
    if (isDraggingSheet.current || isEditMode) return;
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
    if (isEditMode) return;
    isDraggingSheet.current = true;
    dragStartY.current = e.clientY;
    startDragY.current = currentY.current;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSheet.current || isEditMode) return;
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
    if (!isDraggingSheet.current || isEditMode) return;
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

  const toggleEditMode = () => {
    if (!isEditMode) {
      setTempStyleId(savedStyleId);
      setTempShowChip(savedShowChip);
      setIsEditMode(true);
      setIsFlipped(false);
    } else {
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    setSavedStyleId(tempStyleId);
    setSavedShowChip(tempShowChip);
    setIsEditMode(false);
  };

  useEffect(() => {
    updateDOM(currentY.current);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      handleCardPointerCancel();
    };
  }, [isEditMode]);

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
            onClick={toggleEditMode}
            flashColor="bg-white/20"
            className="w-11 h-11 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <img
              src={isEditMode ? "/close.png" : "/edit.png"}
              alt="Toggle Mode"
              className="w-5 h-5 object-contain brightness-0 invert opacity-90 pointer-events-none"
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
            <div className={`absolute inset-0 backface-hidden rounded-[24px] p-5 flex flex-col justify-between shadow-lg transition-colors duration-300 ${activeStyle.bgClass} ${activeStyle.textClass}`}>
              <div className="w-full flex justify-start items-start gap-3">
                <span className="text-[17px] font-semibold tracking-wide">
                  Kumpel
                </span>
              </div>
              
              {activeShowChip && (
                <div className="absolute top-[48px] left-[20px]">
                  <EMVChip />
                </div>
              )}

              <div className="w-full flex justify-between items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-[28px] font-bold tracking-tight leading-none mb-1">
                    500₽
                  </span>
                  <span className="text-[15px] font-medium tracking-widest opacity-80">
                    ***5678
                  </span>
                </div>
                <img
                  src="/logo.png"
                  alt="Bank Logo"
                  className={`w-10 h-10 object-contain pointer-events-none ${activeStyle.isGlass || activeStyle.id === 'dark' || activeStyle.id === 'coffee' ? 'brightness-0 invert opacity-90' : 'brightness-0 opacity-90'}`}
                />
              </div>
            </div>

            <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] p-5 flex flex-col items-center justify-center shadow-lg transition-colors duration-300 ${activeStyle.bgClass} ${activeStyle.textClass}`}>
              <span className="text-[14px] font-semibold opacity-75 mb-1.5 text-center">
                До еженедельного пополнения:
              </span>
              <div className="flex items-baseline text-[34px] font-bold tracking-tight gap-1.5 leading-none">
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
            flashColor="bg-white/20"
            className="flex-1 h-12 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl flex items-center justify-center gap-2"
          >
            <img
              src="/share.png"
              alt="Share"
              className="w-4 h-4 object-contain brightness-0 invert opacity-90 pointer-events-none"
            />
            <span className="text-white/95 text-[15px] font-medium tracking-wide">
              Перевод
            </span>
          </JellyButton>

          <JellyButton
            type="button"
            flashColor="bg-white/20"
            className="flex-1 h-12 rounded-full bg-white/15 border border-white/20 backdrop-blur-xl flex items-center justify-center gap-2"
          >
            <img
              src="/request.png"
              alt="Request"
              className="w-4 h-4 object-contain brightness-0 invert opacity-90 pointer-events-none"
            />
            <span className="text-white/95 text-[15px] font-medium tracking-wide">
              Запросить
            </span>
          </JellyButton>
        </div>
      </div>

      {/* Экран Истории Переводов */}
      <div
        ref={sheetRef}
        className="absolute inset-x-0 z-20 bg-white rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          height: `calc(100dvh - ${MIN_Y}px)`,
          transform: `translate3d(0, ${isEditMode ? '100dvh' : currentY.current + 'px'}, 0)`,
          transition: isDraggingSheet.current ? 'none' : AUTH_TRANSITION,
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

      {/* Экран Редактирования Карты */}
      <div
        className="absolute inset-x-0 z-30 bg-white rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `${MAX_Y}px`,
          height: `calc(100dvh - ${MAX_Y}px)`,
          transform: `translate3d(0, ${isEditMode ? '0' : '100dvh'}, 0)`,
          transition: AUTH_TRANSITION,
        }}
      >
        <div className="w-full pt-3 pb-3 flex flex-col items-center flex-shrink-0">
          <div className="w-9 h-1.5 rounded-full bg-black/15 pointer-events-none" />
        </div>

        <div className="w-full max-w-[340px] px-2 pb-8 flex-1 overflow-y-auto scroll-y-touch flex flex-col">
          <p className="text-black text-[18px] font-bold tracking-tight mb-4 px-1">
            Цвет карты
          </p>

          <div className="w-full flex overflow-x-auto scroll-y-touch gap-3 pb-2 px-1">
            {cardStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setTempStyleId(style.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${tempStyleId === style.id ? 'border-black' : 'border-transparent'}`}>
                  <div className={`w-12 h-12 rounded-full ${style.bgClass} border ${style.isGlass ? 'border-black/10' : 'border-black/5'}`} />
                </div>
                <span className={`text-[12px] font-medium ${tempStyleId === style.id ? 'text-black' : 'text-[#8E8E93]'}`}>
                  {style.name}
                </span>
              </button>
            ))}
          </div>

          <div className="w-full mt-6 bg-black/[0.04] rounded-[20px] p-4 flex flex-col">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/[0.05] flex items-center justify-center">
                  <img src="/chip.png" alt="Chip" className="w-5 h-5 object-contain opacity-80" />
                </div>
                <span className="text-black text-[15px] font-semibold tracking-tight">
                  Показать чип
                </span>
              </div>
              <button
                onClick={() => setTempShowChip(!tempShowChip)}
                className="w-12 h-7 rounded-full relative transition-colors duration-300"
                style={{ backgroundColor: tempShowChip ? activeStyle.accentColor : '#E5E5EA' }}
              >
                <div className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${tempShowChip ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-[#8E8E93] text-[12px] font-normal leading-snug mt-3">
              Включает визуальный чип на Вашей карте.
            </p>
          </div>

          <div className="flex-1" />

          <JellyButton
            type="button"
            onClick={handleSave}
            flashColor="bg-black/10"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-sm mt-6 transition-colors duration-300"
            style={{ 
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF'
            }}
          >
            Сохранить
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
