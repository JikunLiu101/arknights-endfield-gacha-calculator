
interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showMarks?: boolean;
  formatter?: (value: number) => string;
  description?: string;
  warning?: string;
  disabled?: boolean;
}

export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showMarks = true,
  formatter,
  description,
  warning,
  disabled = false,
}: RangeSliderProps) {
  const displayValue = formatter ? formatter(value) : String(value);
  const marks = showMarks
    ? Array.from(
        { length: Math.floor((max - min) / step) + 1 },
        (_, i) => min + i * step
      )
    : [];

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-2xl font-bold text-blue-600">
          {displayValue}
        </span>
      </div>

      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-500
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-600
                   [&::-webkit-slider-thumb]:transition-colors
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-blue-500
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:hover:bg-blue-600
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:transition-colors"
      />

      {showMarks && marks.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {marks.map((mark) => (
            <span key={mark}>{formatter ? formatter(mark) : mark}</span>
          ))}
        </div>
      )}

      {warning && (
        <div className="mt-2 flex items-center text-sm text-amber-600">
          <span className="mr-1">⚠️</span>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
