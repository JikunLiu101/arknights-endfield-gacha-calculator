
import clsx from 'clsx';

export interface CheckboxOption {
  id: string;
  name: string;
  description: string;
  defaultEnabled?: boolean;
}

interface CheckboxCardProps {
  options: CheckboxOption[];
  value: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function CheckboxCard({
  options,
  value,
  onChange,
  disabled = false,
}: CheckboxCardProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isChecked = value[option.id] || false;
        return (
          <label
            key={option.id}
            className={clsx(
              'relative flex cursor-pointer rounded-lg border p-4 transition-all',
              'hover:shadow-sm',
              isChecked
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => !disabled && onChange(option.id, e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex w-full items-start">
              <div
                className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded border-2 mr-3 mt-0.5',
                  isChecked
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                )}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-semibold text-gray-900">
                    {option.name}
                  </span>
                  {option.defaultEnabled && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                      默认开启
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
