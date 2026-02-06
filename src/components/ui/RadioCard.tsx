
import clsx from 'clsx';

export interface RadioOption {
  id: string;
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

interface RadioCardProps {
  options: RadioOption[];
  value: string;
  onChange: (id: string) => void;
  gridCols?: number;
  disabled?: boolean;
}

export function RadioCard({
  options,
  value,
  onChange,
  gridCols = 2,
  disabled = false,
}: RadioCardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${gridCols} gap-4`}>
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <label
            key={option.id}
            className={clsx(
              'relative flex cursor-pointer rounded-xl border-2 p-5 transition-all',
              'hover:shadow-md',
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name="radio-card"
              value={option.id}
              checked={isSelected}
              onChange={() => !disabled && onChange(option.id)}
              disabled={disabled}
              className="sr-only"
            />
            <div className="flex w-full flex-col">
              <div className="flex items-center mb-2">
                <div
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 mr-3',
                    isSelected ? 'border-blue-500' : 'border-gray-300'
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {option.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {option.description}
              </p>
              {option.metadata && Object.keys(option.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {Object.entries(option.metadata).map(([key, val]) => (
                    <div key={key} className="text-xs text-gray-500">
                      <span className="font-medium">{key}:</span> {String(val)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
