import React, { useRef, useEffect, useState } from 'react';
import { useOrientation } from '@/mechanics/useOrientation';
import { JellyButton } from '@/uis/JellyButton';
import { cardStyles, backgroundOptions, ThemeMode } from '@/mechanics/bankStore';

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

interface MainScreenProps {
  onOpenTransfer: () => void;
  onOpenRequest: () => void;
  savedStyleId: string;
  setSavedStyleId: (id: string) => void;
  savedBgId: string;
  setSavedBgId: (id: string) => void;
  savedTheme: ThemeMode;
  setSavedTheme: (t: ThemeMode) => void;
  setPreviewTheme: (t: ThemeMode | null) => void;
  balance: number;
  transactions: Array<{
    id: string;
    name: string;
    type: string;
    amount: string;
    isPositive: boolean;
    date: string;
  }>;
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  profile: {
    name: string;
    username: string;
    avatar: string | null;
  };
}

export const MainScreen: React.FC<MainScreenProps> = ({
  onOpenTransfer,
  onOpenRequest,
  savedStyleId,
  setSavedStyleId,
  savedBgId,
  setSavedBgId,
  savedTheme,
  setSavedTheme,
  setPreviewTheme,
  balance,
  transactions,
  isEditMode,
  setIsEditMode,
  profile,
}) => {
  const tilt = useOrientation(22);

  const sheetRef = useRef<HTMLDivElement>(null);
  const topContentRef = useRef<HTMLDivElement>(null);
  const historyListRef = useRef<HTMLDivElement>(null);

  const currentY = useRef(380);
  const targetY = useRef(380);
  const isDraggingSheet = useRef(false);
  const dragStartY = useRef(0);
  const startDragY = useRef(0);
  const rafId = useRef<number>();

  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: '0', h: '0', m: '0' });

  const [tempStyleId, setTempStyleId] = useState(savedStyleId);
  const [tempBgId, setTempBgId] = useState(savedBgId);
  const [tempTheme, setTempTheme] = useState<ThemeMode>(savedTheme);

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
    const updateTimer = () => {
      const now = new Date();
      const nowUtc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nowMsk = new Date(nowUtc + 3 * 3600000);
      const day = nowMsk.getDay();
      const diffDays = day === 0 ? 1 : 8 - day;
      const nextMon = new Date(nowMsk.getFullYear(), nowMsk.getMonth(), nowMsk.getDate() + diffDays);
      nextMon.setHours(0, 0, 0, 0);

      const diffMs = Math.max(0, nextMon.getTime() - nowMsk.getTime());
      setTimeLeft({
        d: Math.floor(diffMs / (1000 * 60 * 60 * 24)).toString(),
        h: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(),
        m: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString(),
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
      sheetRef.current.style.transform = `translate3d(0, 100%, 0)`;
      sheetRef.current.style.transition = 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)';
    } else {
      sheetRef.current.style.transform = `translate3d(0, ${y - 56}px, 0)`;
      sheetRef.current.style.transition = isDraggingSheet.current ? 'none' : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
    }

    const clampedY = Math.max(56, Math.min(380, y));
    const progress = (clampedY - 56) / (380 - 56);

    const scale = 0.92 + 0.08 * progress;
    const translateY = -15 * (1 - progress);
    const opacity = 0.2 + 0.8 * progress;
    const blurAmount = 4 * (1 - progress);

    topContentRef.current.style.transform = `scale(${scale}) translate3d(0, ${translateY}px, 0)`;
    topContentRef.current.style.opacity = `${opacity}`;
    topContentRef.current.style.filter = blurAmount > 0.1 ? `blur(${blurAmount}px)` : 'none';

    if (historyListRef.current) {
      const availableHeight = Math.max(100, window.innerHeight - clampedY - 80);
      historyListRef.current.style.maxHeight = `${availableHeight}px`;
    }
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
    if (newY < 56) {
      const overshoot = 56 - newY;
      newY = 56 - overshoot * 0.3;
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
    if (velocity < -20) targetY.current = 56;
    else if (velocity > 20) targetY.current = 380;
    else targetY.current = currentY.current < (380 + 56) / 2 ? 56 : 380;

    rafId.current = requestAnimationFrame(smoothSnap);
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      setTempStyleId(savedStyleId);
      setTempBgId(savedBgId);
      setTempTheme(savedTheme);
      targetY.current = 380;
      currentY.current = 380;
      setIsEditMode(true);
      setIsFlipped(false);
    } else {
      setPreviewTheme(null);
      setIsEditMode(false);
    }
  };

  const handleSave = () => {
    setSavedStyleId(tempStyleId);
    setSavedBgId(tempBgId);
    setSavedTheme(tempTheme);
    setPreviewTheme(null);
    setIsEditMode(false);
  };

  useEffect(() => {
    updateDOM(currentY.current);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      handleCardPointerCancel();
    };
  }, [isEditMode]);

  const displayName = profile.name.length > 7 ? profile.name.slice(0, 7) + '…' : profile.name;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col select-none bg-transparent">
      <div
        className="absolute inset-[-60px] bg-cover bg-center pointer-events-none will-change-transform transition-opacity duration-200 ease-in-out"
        style={{
          backgroundImage: `url(${currentBgImage})`,
          opacity: bgOpacity,
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.15)`,
        }}
      />

      <div
        ref={topContentRef}
        className="relative z-10 w-full px-5 pt-[calc(env(safe-area-inset-top,16px)+6px)] pb-3 flex flex-col items-center flex-shrink-0 origin-top will-change-transform"
      >
        <div className="w-full max-w-[340px] flex justify-between items-center mb-2.5">
          <div className="h-11 px-2.5 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-black/10">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full pointer-events-none"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#E33125] to-[#FF6B6B] flex items-center justify-center text-white font-bold text-[13px] shadow-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center pr-1.5">
              <span className="text-white text-[13px] font-bold tracking-tight leading-tight">
                {displayName}
              </span>
              <span className="text-white/60 text-[10px] font-medium leading-tight">
                @{profile.username}
              </span>
            </div>
          </div>

          <JellyButton
            type="button"
            onClick={toggleEditMode}
            flashColor="bg-white/15"
            className="w-11 h-11 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center shadow-sm"
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
                    {balance} ₭
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
            onClick={isEditMode ? undefined : onOpenTransfer}
            flashColor="bg-white/15"
            className={`flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center gap-2 transition-opacity duration-300 ${
              isEditMode ? 'opacity-40 pointer-events-none' : 'opacity-100'
            }`}
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
            onClick={isEditMode ? undefined : onOpenRequest}
            flashColor="bg-white/15"
            className={`flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center gap-2 transition-opacity duration-300 ${
              isEditMode ? 'opacity-40 pointer-events-none' : 'opacity-100'
            }`}
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
        className="absolute inset-x-0 z-20 bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-[24px] border-t border-white/40 dark:border-white/10 rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `56px`,
          height: `calc(100% - 56px)`,
        }}
      >
        <div
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
          className="w-full pt-3 pb-3 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
        >
          <div className="w-9 h-1.5 rounded-full bg-black/20 dark:bg-white/20 pointer-events-none" />
          <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight mt-3 text-center pointer-events-none">
            История переводов
          </p>
        </div>

        <div
          ref={historyListRef}
          className="w-full max-w-[340px] px-2 pb-[120px] flex-1 overflow-y-auto scroll-y-touch touch-pan-y flex flex-col gap-2.5"
        >
          {transactions.length === 0 ? (
            <div className="w-full flex-1 flex items-center justify-center py-10 text-center">
              <span className="text-[#8E8E93] text-[13px] font-medium">
                Вы еще не совершали переводов
              </span>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="w-full h-14 px-4 rounded-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm flex items-center justify-between flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.1] flex items-center justify-center flex-shrink-0">
                    <img
                      src="/transfer.png"
                      alt="Transfer"
                      className="w-4 h-4 object-contain brightness-0 dark:invert opacity-80 pointer-events-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-black dark:text-white text-[14px] font-semibold tracking-tight leading-tight">
                      {tx.name}
                    </span>
                    <span className="text-[#8E8E93] text-[11px] font-normal leading-tight">
                      {tx.type}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-black dark:text-white text-[14px] font-semibold tracking-tight leading-tight">
                    {tx.amount}
                  </span>
                  <span className="text-[#8E8E93] text-[11px] font-normal leading-tight">
                    {tx.date}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="absolute inset-x-0 z-30 bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-[24px] border-t border-white/40 dark:border-white/10 rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `380px`,
          height: `calc(100% - 380px)`,
          transform: `translate3d(0, ${isEditMode ? '0' : '100%'}, 0)`,
          transition: 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="w-full pt-3 pb-2 flex flex-col items-center flex-shrink-0">
          <div className="w-9 h-1.5 rounded-full bg-black/20 dark:bg-white/20 pointer-events-none" />
        </div>

        <div className="w-full max-w-[340px] px-2 pb-[120px] flex-1 overflow-y-auto scroll-y-touch flex flex-col gap-4">
          <div className="flex flex-col flex-shrink-0">
            <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight px-1 mb-2">
              Цвет карты
            </p>

            <div className="w-full flex justify-between px-1 mb-4">
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
                        isSelected ? 'text-black dark:text-white' : 'text-[#8E8E93]'
                      }`}
                    >
                      {style.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight px-1 mb-2">
              Тема приложения
            </p>

            <div className="w-full grid grid-cols-3 gap-2.5 px-1 mb-4">
              {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => {
                const isSelected = tempTheme === t;
                const names: Record<ThemeMode, string> = { light: 'Светлая', dark: 'Темная', system: 'Как в системе' };
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setTempTheme(t);
                      setPreviewTheme(t);
                    }}
                    className={`h-10 rounded-[12px] text-[12px] font-semibold transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md scale-[0.98]' 
                        : 'bg-white/40 text-[#8E8E93] dark:bg-white/5 border-white/40 dark:border-white/10'
                    }`}
                  >
                    {names[t]}
                  </button>
                );
              })}
            </div>

            <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight px-1 mb-2">
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
                        isSelected ? 'border-black dark:border-white scale-[0.98]' : 'border-transparent'
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-[14px] bg-cover bg-center border border-black/5 dark:border-white/10"
                        style={{ backgroundImage: `url(${bg.image})` }}
                      />
                    </div>
                    <span
                      className={`text-[12px] font-medium transition-colors duration-200 ${
                        isSelected ? 'text-black dark:text-white' : 'text-[#8E8E93]'
                      }`}
                    >
                      {bg.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full flex-shrink-0 pt-2 pb-2">
            <JellyButton
              type="button"
              onClick={handleSave}
              flashColor="bg-black/10"
              className="w-full h-12 min-h-[48px] rounded-full flex items-center justify-center font-semibold text-[16px] shadow-sm transition-colors duration-300 flex-shrink-0"
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
    </div>
  );
};
