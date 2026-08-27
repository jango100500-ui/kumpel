import React, { useState, useRef } from 'react';
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

export const MainScreen: React.FC = () => {
  const tilt = useOrientation(22);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartY = useRef(0);
  const currentDragOffset = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    currentDragOffset.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartY.current;

    if (!isExpanded) {
      if (deltaY < 0) {
        currentDragOffset.current = deltaY;
      } else {
        currentDragOffset.current = deltaY * 0.2;
      }
    } else {
      if (deltaY > 0) {
        currentDragOffset.current = deltaY;
      } else {
        currentDragOffset.current = deltaY * 0.2;
      }
    }

    setDragOffset(currentDragOffset.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const delta = currentDragOffset.current;

    if (!isExpanded) {
      if (delta < -70) {
        setIsExpanded(true);
      }
    } else {
      if (delta > 70) {
        setIsExpanded(false);
      }
    }

    setDragOffset(0);
    currentDragOffset.current = 0;
  };

  const sheetTop = isExpanded ? 54 : 375;
  const targetTranslateY = isDragging ? dragOffset : 0;

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-[#5491D0] select-none">
      <div
        className="absolute top-0 left-[-50px] right-[-50px] bottom-0 bg-cover bg-center pointer-events-none will-change-transform"
        style={{
          backgroundImage: 'url(/background2.png)',
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.12)`,
        }}
      />

      <div
        className="relative z-10 w-full px-5 pt-3 pb-3 flex flex-col items-center flex-shrink-0 transition-all duration-350 ease-out"
        style={{
          opacity: isExpanded ? 0.2 : 1,
          transform: isExpanded ? 'scale(0.95) translateY(-10px)' : 'scale(1) translateY(0)',
          filter: isExpanded ? 'blur(2px)' : 'none',
        }}
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

        <div className="relative w-full max-w-[340px] aspect-[1.75/1] bg-[#E33125] rounded-[24px] p-5 flex flex-col justify-between overflow-hidden shadow-lg">
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
            className="flex-1 h-12 rounded-full bg-black/10 border border-white/[0.16] backdrop-blur-md flex items-center justify-center"
          >
            <span className="text-white/90 text-[15px] font-medium tracking-wide">
              7д 0ч 0м
            </span>
          </JellyButton>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-20 bg-white rounded-t-[36px] flex flex-col items-center shadow-[-0px_-10px_35px_rgba(0,0,0,0.15)] will-change-transform"
        style={{
          top: `${sheetTop}px`,
          transform: `translateY(${targetTranslateY}px)`,
          transition: isDragging ? 'none' : 'top 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full pt-2.5 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
        >
          <div className="w-9 h-1.5 rounded-full bg-black/15" />
          <p className="text-[#8E8E93] text-[13px] font-medium tracking-tight mt-2.5 text-center pointer-events-none">
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
