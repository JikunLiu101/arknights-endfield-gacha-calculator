import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  description?: string;
  disabled?: boolean;
}

export function Select({
  label,
  options,
  value,
  onChange,
  description,
  disabled = false,
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium text-gray-300 mb-1">
              {label}
            </Listbox.Label>
            {description && (
              <p className="text-xs text-gray-400 mb-2">{description}</p>
            )}
            <div className="relative">
              <Listbox.Button
                className={clsx(
                  'relative w-full px-4 py-3 rounded-lg border-2 transition-all',
                  'text-base font-medium text-left',
                  'bg-slate-900/50 text-gray-100',
                  'focus:outline-none',
                  open
                    ? 'border-blue-500'
                    : 'border-slate-700 hover:border-slate-600',
                  disabled && 'bg-slate-900/30 cursor-not-allowed'
                )}
              >
                <span className="block truncate">
                  {selectedOption?.label || '请选择'}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDownIcon
                    className={clsx(
                      'h-5 w-5 text-gray-400 transition-transform',
                      open && 'transform rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-2 w-full bg-slate-800 shadow-lg max-h-60 rounded-lg py-1 text-base overflow-auto focus:outline-none border border-slate-700">
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        clsx(
                          'relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors',
                          active ? 'bg-blue-900/50 text-blue-100' : 'text-gray-200'
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              'block truncate',
                              selected ? 'font-semibold' : 'font-normal'
                            )}
                          >
                            {option.label}
                          </span>
                          {selected && (
                            <span
                              className={clsx(
                                'absolute inset-y-0 left-0 flex items-center pl-3',
                                active ? 'text-blue-600' : 'text-blue-600'
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
}
