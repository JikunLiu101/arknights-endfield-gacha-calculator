
import { RadioCard, RadioOption } from '../ui/RadioCard';
import { CheckboxCard, CheckboxOption } from '../ui/CheckboxCard';

interface StrategySelectorProps {
  baseStrategy: 'S1' | 'S2';
  addonStrategies: {
    A1: boolean;
    A2: boolean;
    A3: boolean;
  };
  onBaseStrategyChange: (strategy: 'S1' | 'S2') => void;
  onAddonStrategyToggle: (id: 'A1' | 'A2' | 'A3') => void;
  disabled?: boolean;
}

const baseStrategyOptions: RadioOption[] = [
  {
    id: 'S1',
    name: 'S1: 保底派',
    description: '门槛：>80抽进入角色池。稳健策略，触发硬保底后再抽。',
    metadata: {
      阈值: '80抽',
    },
  },
  {
    id: 'S2',
    name: 'S2: 井派',
    description: '门槛：>120抽进入角色池。保守策略，确保能触发井机制。',
    metadata: {
      阈值: '120抽',
    },
  },
];

const addonStrategyOptions: CheckboxOption[] = [
  {
    id: 'A1',
    name: 'A1: 永远使用情报书和卡池赠送',
    description: '自动使用卡池赠送10抽和寻访情报书，最大化免费资源利用。',
    defaultEnabled: true,
  },
  {
    id: 'A2',
    name: 'A2: 凑加急寻访',
    description:
      '预支未来资源凑够30抽触发加急招募，赚取武库配额。需要盈余>20/10抽。',
    defaultEnabled: false,
  },
  {
    id: 'A3',
    name: 'A3: 凑情报书',
    description: '预支未来资源凑够60抽触发情报书，为下个池准备。需要盈余>50/40抽。',
    defaultEnabled: false,
  },
];

export function StrategySelector({
  baseStrategy,
  addonStrategies,
  onBaseStrategyChange,
  onAddonStrategyToggle,
  disabled = false,
}: StrategySelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">基础策略</h3>
        <RadioCard
          options={baseStrategyOptions}
          value={baseStrategy}
          onChange={(id) => onBaseStrategyChange(id as 'S1' | 'S2')}
          gridCols={2}
          disabled={disabled}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">附加策略</h3>
        <CheckboxCard
          options={addonStrategyOptions}
          value={addonStrategies}
          onChange={(id, _checked) => onAddonStrategyToggle(id as 'A1' | 'A2' | 'A3')}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
