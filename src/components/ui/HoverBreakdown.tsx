import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface HoverBreakdownProps {
  lines?: string[];
  children: ReactNode;
  title?: string;
}

export function HoverBreakdown({
  lines,
  children,
  title = '来源明细',
}: HoverBreakdownProps) {
  if (!lines || lines.length === 0) {
    return <>{children}</>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const overTriggerRef = useRef(false);
  const overTooltipRef = useRef(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const openNow = () => {
    clearHideTimer();
    setIsOpen(true);
  };

  const scheduleHideIfNeeded = () => {
    if (overTriggerRef.current || overTooltipRef.current) return;

    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      // 再次确认：0.1s 后仍然不在两者区域内才隐藏
      if (!overTriggerRef.current && !overTooltipRef.current) {
        setIsOpen(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => {
          overTriggerRef.current = true;
          openNow();
        }}
        onMouseLeave={() => {
          overTriggerRef.current = false;
          scheduleHideIfNeeded();
        }}
      >
        {children}
      </div>

      <div
        className={`${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        } transition-opacity absolute z-30 left-0 top-full mt-2 w-[28rem] max-w-[90vw]`}
        onMouseEnter={() => {
          overTooltipRef.current = true;
          openNow();
        }}
        onMouseLeave={() => {
          overTooltipRef.current = false;
          scheduleHideIfNeeded();
        }}
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">{title}</div>
          <div className="max-h-72 overflow-auto">
            <ul className="space-y-1">
              {lines.map((line, idx) => (
                <li key={idx} className="text-xs text-gray-700 leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
