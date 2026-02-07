
import { NumberInput } from '../ui/NumberInput';
import { RangeSlider } from '../ui/RangeSlider';
import { Select, SelectOption } from '../ui/Select';
import { CheckboxCard, type CheckboxOption } from '../ui/CheckboxCard';

interface PlanningInputsProps {
  pullsPerVersion: number;
  arsenalPerVersion: number;
  versionCount: number;
  bannersPerVersion: number;
  excludeFirstVersionResources: boolean;
  errors?: {
    pullsPerVersion?: string;
    arsenalPerVersion?: string;
  };
  onChange: (key: string, value: number) => void;
  onToggleExcludeFirstVersionResources: (checked: boolean) => void;
  disabled?: boolean;
}

const bannerOptions: SelectOption[] = [
  { value: 1, label: '1个卡池/版本' },
  { value: 2, label: '2个卡池/版本' },
  { value: 3, label: '3个卡池/版本' },
];

const excludeFirstVersionOption: CheckboxOption[] = [
  {
    id: 'excludeFirstVersionResources',
    name: '第一个版本不计入版本资源',
    description:
      '第一个版本的所有资源我已经获取/花掉，因此不再计入版本资源，只计算后续版本可以获得的资源',
  },
];

export function PlanningInputs({
  pullsPerVersion,
  arsenalPerVersion,
  versionCount,
  bannersPerVersion,
  excludeFirstVersionResources,
  errors = {},
  onChange,
  onToggleExcludeFirstVersionResources,
  disabled = false,
}: PlanningInputsProps) {
  const handleArsenalChange = (delta: number) => {
    const newValue = Math.max(0, arsenalPerVersion + delta);
    onChange('arsenalPerVersion', newValue);
  };

  return (
    <div className="space-y-5">
      <NumberInput
        label="每版本获得角色抽数"
        value={pullsPerVersion}
        onChange={(value) => onChange('pullsPerVersion', value)}
        min={0}
        step={1}
        placeholder="80"
        description="每个版本预计可获得的角色抽数（不含指定了某个卡池才能使用的角色抽数，只计算版本福利、每日、活动等获得的通用角色抽数）"
        error={errors.pullsPerVersion}
        disabled={disabled}
      />

      <div>
        <div className="flex gap-2">
          <div className="flex-1">
            <NumberInput
              label={`每版本获得武库配额 （目前约 ${(arsenalPerVersion / 1980).toFixed(2)} 次申领）`}
              value={arsenalPerVersion}
              onChange={(value) => onChange('arsenalPerVersion', value)}
              min={0}
              step={100}
              placeholder="1980"
              description="每个版本预计可获得的武库配额（计算版本福利、每日、活动等获得的武库配额）"
              error={errors.arsenalPerVersion}
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

      <RangeSlider
        label="规划版本数"
        value={versionCount}
        min={1}
        max={8}
        step={1}
        onChange={(value) => onChange('versionCount', value)}
        formatter={(v) => `${v}个版本`}
        description="规划未来多少个版本的资源和抽卡，最多8个版本"
        disabled={disabled}
      />

      <CheckboxCard
        options={excludeFirstVersionOption}
        value={{ excludeFirstVersionResources }}
        onChange={(_, checked) => onToggleExcludeFirstVersionResources(checked)}
        disabled={disabled}
      />

      <Select
        label="每版本卡池数"
        options={bannerOptions}
        value={bannersPerVersion}
        onChange={(value) => onChange('bannersPerVersion', Number(value))}
        description="每个版本预计出现的限定角色卡池数量"
        disabled={disabled}
      />
    </div>
  );
}
