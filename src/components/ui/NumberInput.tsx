import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  description,
  error,
  disabled = false,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && (max === undefined || numValue <= max)) {
      onChange(Math.floor(numValue)); // 只接受整数
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(displayValue);
    if (isNaN(numValue) || numValue < min) {
      onChange(min);
    } else if (max !== undefined && numValue > max) {
      onChange(max);
    } else {
      onChange(Math.floor(numValue));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select(); // 聚焦时选中全部文本
  };

  return (
    <div className="w-full">
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <input
        id={label}
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'w-full px-4 py-3 rounded-lg border-2 transition-all',
          'text-base font-medium',
          'focus:outline-none',
          error
            ? 'border-red-500 focus:border-red-500'
            : isFocused
            ? 'border-blue-500'
            : 'border-gray-200 hover:border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
