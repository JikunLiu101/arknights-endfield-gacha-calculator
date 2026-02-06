
import clsx from 'clsx';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  colorScheme?: 'blue' | 'purple' | 'amber' | 'rose' | 'cyan' | 'indigo';
}

const colorSchemes = {
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
  amber: 'bg-amber-50 border-amber-100',
  rose: 'bg-rose-50 border-rose-100',
  cyan: 'bg-cyan-50 border-cyan-100',
  indigo: 'bg-indigo-50 border-indigo-100',
};

export function Card({ title, children, className, headerAction, colorScheme }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        className
      )}
    >
      {title && (
        <div className={clsx(
          'px-6 py-4 border-b',
          colorScheme ? colorSchemes[colorScheme] : 'border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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
