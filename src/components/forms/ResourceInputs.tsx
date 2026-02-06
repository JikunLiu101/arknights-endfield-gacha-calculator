
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
  return (
    <div className="space-y-4">
      <NumberInput
        label="当前角色抽数"
        value={currentPulls}
        onChange={(value) => onChange('currentPulls', value)}
        min={0}
        step={1}
        placeholder="0"
        tooltip="您当前拥有的角色池抽数"
        error={errors.currentPulls}
        disabled={disabled}
      />

      <NumberInput
        label="当前武库配额"
        value={currentArsenal}
        onChange={(value) => onChange('currentArsenal', value)}
        min={0}
        step={1}
        placeholder="0"
        tooltip="您当前拥有的武库库配额点数"
        error={errors.currentArsenal}
        disabled={disabled}
      />
    </div>
  );
}
