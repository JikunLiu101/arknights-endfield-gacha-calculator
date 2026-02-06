
import { NumberInput } from '../ui/NumberInput';

interface ResourceInputsProps {
  currentPulls: number;
  currentArsenal: number;
  errors?: {
    currentPulls?: string;
    currentArsenal?: string;
  };
  onChange: (key: string, value: number) => void;
  disabled?: boolean;
}

export function ResourceInputs({
  currentPulls,
  currentArsenal,
  errors = {},
  onChange,
  disabled = false,
}: ResourceInputsProps) {
  const handleArsenalChange = (delta: number) => {
    const newValue = Math.max(0, currentArsenal + delta);
    onChange('currentArsenal', newValue);
  };

  return (
    <div className="space-y-4">
      <NumberInput
        label="当前角色抽数"
        value={currentPulls}
        onChange={(value) => onChange('currentPulls', value)}
        min={0}
        step={1}
        placeholder="0"
        description="您当前拥有的角色抽数（含未获取的、不随版本更新的所有一次性角色抽数）"
        error={errors.currentPulls}
        disabled={disabled}
      />

      <div>
        <div className="flex gap-2">
          <div className="flex-1">
            <NumberInput
              label={`当前武库配额 （目前约${(currentArsenal / 1980).toFixed(2)}次申领）`}
              value={currentArsenal}
              onChange={(value) => onChange('currentArsenal', value)}
              min={0}
              step={1}
              placeholder="0"
              description="您当前拥有的武库配额（含未获取的、不随版本更新的所有一次性武库配额）"
              error={errors.currentArsenal}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <button
              type="button"
              onClick={() => handleArsenalChange(1980)}
              disabled={disabled}
              className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              +1申领
            </button>
            <button
              type="button"
              onClick={() => handleArsenalChange(-1980)}
              disabled={disabled}
              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              -1申领
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
