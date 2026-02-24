
import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  colorScheme?: 'blue' | 'purple' | 'red' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'yellow' | 'green';
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

export function Card({ title, children, className, headerAction, colorScheme }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg overflow-visible',
        className
      )}
    >
      {title && (
        <div className={clsx(
          'px-6 py-4 border-b',
          colorScheme ? colorSchemes[colorScheme] : 'border-slate-700/50'
        )}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            {headerAction && (
              <div className="flex-shrink-0">{headerAction}</div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
