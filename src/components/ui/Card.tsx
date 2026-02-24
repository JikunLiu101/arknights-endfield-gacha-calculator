
import clsx from 'clsx';
import { useState } from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  colorScheme?: 'blue' | 'purple' | 'red' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'yellow' | 'green';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const colorSchemes = {
  blue: 'bg-blue-900/60 border-blue-700/80',
  purple: 'bg-purple-900/60 border-purple-700/80',
  red: 'bg-red-900/60 border-red-700/80',
  amber: 'bg-amber-900/60 border-amber-700/80',
  rose: 'bg-rose-900/60 border-rose-700/80',
  cyan: 'bg-cyan-900/60 border-cyan-700/80',
  indigo: 'bg-indigo-900/60 border-indigo-700/80',
  yellow: 'bg-yellow-900/60 border-yellow-700/80',
  green: 'bg-green-900/60 border-green-700/80',
};

export function Card({ 
  title, 
  children, 
  className, 
  headerAction, 
  colorScheme,
  collapsible = true,
  defaultCollapsed = false 
}: CardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  const toggleCollapse = () => {
    if (collapsible && title) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      className={clsx(
        'bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg overflow-visible',
        className
      )}
    >
      {title && (
        <div 
          className={clsx(
            'px-6 py-4 border-b',
            colorScheme ? colorSchemes[colorScheme] : 'border-slate-700/50',
            collapsible && 'cursor-pointer select-none hover:opacity-90 transition-opacity'
          )}
          onClick={toggleCollapse}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            <div className="flex items-center gap-2">
              {headerAction && (
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {headerAction}
                </div>
              )}
              {collapsible && (
                <svg 
                  className={clsx(
                    'w-5 h-5 text-gray-300 transition-transform duration-200 flex-shrink-0',
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      )}
      {!isCollapsed && (
        <div className="p-6">{children}</div>
      )}
    </div>
  );
}
