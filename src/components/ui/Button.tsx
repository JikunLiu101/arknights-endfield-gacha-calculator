
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  className,
}: ButtonProps) {
  const baseStyles = clsx(
    'px-6 py-3 rounded-lg font-semibold text-base',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-98',
    fullWidth && 'w-full'
  );

  const variantStyles = {
    primary: clsx(
      'bg-gradient-to-r from-blue-600 to-purple-600',
      'text-white',
      'shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
      'focus:ring-blue-500',
      !disabled && !loading && 'hover:from-blue-700 hover:to-purple-700'
    ),
    secondary: clsx(
      'bg-slate-700/50 border-2 border-slate-600',
      'text-gray-200',
      'hover:bg-slate-700',
      'focus:ring-slate-500'
    ),
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(baseStyles, variantStyles[variant], className)}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
