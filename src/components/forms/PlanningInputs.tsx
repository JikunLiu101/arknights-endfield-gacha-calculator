
import { NumberInput } from '../ui/NumberInput';
import { RangeSlider } from '../ui/RangeSlider';
import { Select, SelectOption } from '../ui/Select';

interface PlanningInputsProps {
  pullsPerVersion: number;
  arsenalPerVersion: number;
  versionCount: number;
  bannersPerVersion: number;
  errors?: {
    pullsPerVersion?: string;
    arsenalPerVersion?: string;
  };
  onChange: (key: string, value: number) => void;
  disabled?: boolean;
}

const bannerOptions: SelectOption[] = [
  { value: 1, label: '1个卡池/版本' },
  { value: 2, label: '2个卡池/版本' },
  { value: 3, label: '3个卡池/版本' },
];

export function PlanningInputs({
  pullsPerVersion,
  arsenalPerVersion,
  versionCount,
  bannersPerVersion,
  errors = {},
  onChange,
  disabled = false,
}: PlanningInputsProps) {
  return (
    <div className="space-y-5">
      <NumberInput
        label="每版本获得角色抽数"
        value={pullsPerVersion}
        onChange={(value) => onChange('pullsPerVersion', value)}
        min={0}
        step={1}
        placeholder="50"
        tooltip="每个版本预计可获得的角色池抽数"
        error={errors.pullsPerVersion}
        disabled={disabled}
      />

      <NumberInput
        label="每版本获得武库配额"
        value={arsenalPerVersion}
        onChange={(value) => onChange('arsenalPerVersion', value)}
        min={0}
        step={100}
        placeholder="1000"
        tooltip="每个版本预计可获得的武库配额点数"
        error={errors.arsenalPerVersion}
        disabled={disabled}
      />

      <RangeSlider
        label="规划版本数"
        value={versionCount}
        min={1}
        max={8}
        step={1}
        onChange={(value) => onChange('versionCount', value)}
        formatter={(v) => `${v}个版本`}
        disabled={disabled}
      />

      <Select
        label="每版本卡池数"
        options={bannerOptions}
        value={bannersPerVersion}
        onChange={(value) => onChange('bannersPerVersion', Number(value))}
        tooltip="每个版本预计出现的限定角色卡池数量"
        disabled={disabled}
      />
    </div>
  );
}
