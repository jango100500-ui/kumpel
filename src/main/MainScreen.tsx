import React, { useRef, useEffect, useState } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { cardStyles, backgroundOptions } from '@/mechanics/bankStore';

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
const AUTH_TRANSITION = 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)';

interface MainScreenProps {
  onOpenTransfer: () => void;
  savedStyleId: string;
  setSavedStyleId: (id: string) => void;
  savedBgId: string;
  setSavedBgId: (id: string) => void;
  balance: number;
}

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
  <div className="w-10 h-[28px] rounded-md bg-gradient-to-br from-[#D1D1D6] via-[#E5E5EA] to-[#C7C7CC] border border-[#8E8E93]/50 relative overflow-hidden flex items-center justify-center shadow-sm opacity-90">
    <div className="absolute inset-x-0 top-1/4 h-[0.5px] bg-[#8E8E93]/40" />
    <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-[#8E8E93]/40" />
    <div className="absolute inset-x-0 top-3/4 h-[0.5px] bg-[#8E8E93]/40" />
    <div className="absolute inset-y-0 left-1/4 w-[0.5px] bg-[#8E8E93]/40" />
    <div className="absolute inset-y-0 right-1/4 w-[0.5px] bg-[#8E8E93]/40" />
    <div className="w-3.5 h-4 rounded-full border-[0.5px] border-[#8E8E93]/40" />
  </div>
);

export const MainScreen: React.FC<MainScreenProps> = ({
  onOpenTransfer,
  savedStyleId,
  setSavedStyleId,
  savedBgId,
  setSavedBgId,
  balance,
}) => {
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

  const [tempStyleId, setTempStyleId] = useState(savedStyleId);
  const [tempBgId, setTempBgId] = useState(savedBgId);

  const [currentBgImage, setCurrentBgImage] = useState('/background2.png');
  const [bgOpacity, setBgOpacity] = useState(1);

  const activeStyle = cardStyles.find((s) => s.id === (isEditMode ? tempStyleId : savedStyleId)) || cardStyles[0];
  const activeBg = backgroundOptions.find((b) => b.id === (isEditMode ? tempBgId : savedBgId)) || backgroundOptions[0];

  useEffect(() => {
    if (activeBg.image !== currentBgImage) {
      setBgOpacity(0);
      const timeout = setTimeout(() => {
        setCurrentBgImage(activeBg.image);
        setBgOpacity(1);
      }, 160);
      return () => clearTimeout(timeout);
    }
  }, [activeBg.image, currentBgImage]);

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

    if (isEditMode) {
      sheetRef.current.style.transform = `translate3d(0, 100dvh, 0)`;
      sheetRef.current.style.transition = AUTH_TRANSITION;
    } else {
      sheetRef.current.style.transform = `translate3d(0, ${y - MIN_Y}px, 0)`;
      sheetRef.current.style.transition = isDraggingSheet.current ? 'none' : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
    }

    const clampedY = Math.max(MIN_Y, Math.min(MAX_Y, y));
    const progress = (clampedY - MIN_Y) / (MAX_Y - MIN_Y);

    const scale = 0.92 + 0.08 * progress;
    const translateY = -15 * (1 - progress);
    const opacity = 0.2 + 0.8 * progress;
    const blurAmount = 4 * (1 - progress);

    topContentRef.current.style.transform = `scale(${scale}) translate3d(0, ${translateY}px, 0)`;
    topContentRef.current.style.opacity = `${opacity}`;
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
      setTempBgId(savedBgId);
      targetY.current = MAX_Y;
      currentY.current = MAX_Y;
      setIsEditMode(true);
      setIsFlipped(false);
    } else {
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    setSavedStyleId(tempStyleId);
    setSavedBgId(tempBgId);
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
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200 ease-in-out"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          opacity: bgOpacity,
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
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <img
              src={isEditMode ? '/close.png' : '/edit.png'}
              alt="Toggle Mode"
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
            <div
              className={`absolute inset-0 backface-hidden rounded-[24px] p-5 flex flex-col justify-between shadow-lg transition-colors duration-300 ${activeStyle.bgClass} ${activeStyle.textClass}`}
            >
              <div className="w-full flex justify-start items-start gap-3">
                <span className="text-[17px] font-semibold tracking-wide">
                  Kumpel
                </span>
              </div>

              <div className="absolute top-[48px] right-[20px]">
                <EMVChip />
              </div>

              <div className="w-full flex justify-between items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-[28px] font-bold tracking-tight leading-none mb-1 transition-all duration-300">
                    {balance}₽
                  </span>
                  <span className="text-[15px] font-medium tracking-widest opacity-80">
                    ***5678
                  </span>
                </div>
                <img
                  src="/logo.png"
                  alt="Bank Logo"
                  className={`w-10 h-10 object-contain pointer-events-none ${
                    activeStyle.isDarkLogo ? 'brightness-0 opacity-90' : 'brightness-0 invert opacity-90'
                  }`}
                />
              </div>
            </div>

            <div
              className={`absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] p-5 flex flex-col items-center justify-center shadow-lg transition-colors duration-300 ${activeStyle.bgClass} ${activeStyle.textClass}`}
            >
              <span className="text-[14px] font-semibold opacity-75 mb-1.5 text-center">
                До еженедельного пополнения:
              </span>
              <div className="flex items-baseline text-[34px] font-bold tracking-tight gap-1.5 leading-none">
                <div className="flex items-baseline">
                  <AnimatedDigit value={timeLeft.d} />
                  <span className="text-[18px] ml-0.5 opacity-90">д</span>
                </div>
                <div className="flex items-baseline">
                  <AnimatedDigit value={timeLeft.h} />
                  <span className="text-[18px] ml-0.5 opacity-90">ч</span>
                </div>
                <div className="flex items-baseline">
                  <AnimatedDigit value={timeLeft.m} />
                  <span className="text-[18px] ml-0.5 opacity-90">м</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[340px] flex gap-3 mt-3.5">
          <JellyButton
            type="button"
            onClick={onOpenTransfer}
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

      <div
        className="absolute inset-x-0 z-30 bg-white rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `${MAX_Y}px`,
          height: `calc(100dvh - ${MAX_Y}px)`,
          transform: `translate3d(0, ${isEditMode ? '0' : '100dvh'}, 0)`,
          transition: AUTH_TRANSITION,
        }}
      >
        <div className="w-full pt-3 pb-2 flex flex-col items-center flex-shrink-0">
          <div className="w-9 h-1.5 rounded-full bg-black/15 pointer-events-none" />
        </div>

        <div className="w-full max-w-[340px] px-2 pb-8 flex-1 overflow-y-auto scroll-y-touch flex flex-col justify-between">
          <div className="flex flex-col">
            <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight px-1 mb-2">
              Цвет карты
            </p>

            <div className="w-full flex justify-between px-1 mb-5">
              {cardStyles.map((style) => {
                const isSelected = tempStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setTempStyleId(style.id)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors duration-200"
                      style={{ borderColor: isSelected ? style.accentColor : 'transparent' }}
                    >
                      <div
                        className={`w-9 h-9 rounded-full ${style.bgClass} border border-black/[0.08] shadow-sm transition-transform duration-200 ${
                          isSelected ? 'scale-[0.82]' : 'scale-100'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium transition-colors duration-200 ${
                        isSelected ? 'text-black' : 'text-[#8E8E93]'
                      }`}
                    >
                      {style.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight px-1 mb-2.5">
              Фон
            </p>

            <div className="w-full grid grid-cols-3 gap-2.5 px-1">
              {backgroundOptions.map((bg) => {
                const isSelected = tempBgId === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => setTempBgId(bg.id)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-full aspect-[9/13] rounded-[18px] overflow-hidden border-2 transition-all duration-200 p-[2px] ${
                        isSelected ? 'border-black scale-[0.98]' : 'border-transparent'
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-[14px] bg-cover bg-center border border-black/5"
                        style={{ backgroundImage: `url(${bg.image})` }}
                      />
                    </div>
                    <span
                      className={`text-[12px] font-medium transition-colors duration-200 ${
                        isSelected ? 'text-black' : 'text-[#8E8E93]'
                      }`}
                    >
                      {bg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <JellyButton
            type="button"
            onClick={handleSave}
            flashColor="bg-black/10"
            className="w-full h-12 rounded-full flex items-center justify-center font-semibold text-[16px] shadow-sm mt-5 mb-2 transition-colors duration-300"
            style={{
              backgroundColor: activeStyle.accentColor,
              color: activeStyle.id === 'vanilla' ? '#19181F' : '#FFFFFF',
            }}
          >
            Сохранить
          </JellyButton>
        </div>
      </div>
    </div>
  );
};
