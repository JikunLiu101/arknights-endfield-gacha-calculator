import { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { RadioCard, RadioOption } from '../ui/RadioCard';
import { CheckboxCard, CheckboxOption } from '../ui/CheckboxCard';
import { MechanismDialog } from '../ui/MechanismDialog';

interface StrategySelectorProps {
  baseStrategy: 'S1' | 'S2';
  addonStrategies: {
    A1: boolean;
    A2: boolean;
    A3: boolean;
    A4: boolean;
  };
  onBaseStrategyChange: (strategy: 'S1' | 'S2') => void;
  onAddonStrategyToggle: (id: 'A1' | 'A2' | 'A3' | 'A4') => void;
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
    description: '自动使用每个卡池赠送的10抽和寻访情报书，最大化免费资源利用。',
    defaultEnabled: true,
  },
  {
    id: 'A2',
    name: 'A2: 凑加急寻访',
    description:
      '当前库存不足阈值但预期盈余充足时，预支库存10/20抽（视情报书而定）配合卡池赠送凑够30抽，触发加急招募赚取武库配额。盈余计算：库存+卡池赠送(10)+情报书(10/0)+下版本收入-阈值，需盈余>10/20抽。',
    defaultEnabled: false,
  },
  {
    id: 'A3',
    name: 'A3: 凑情报书',
    description: '当前库存不足阈值但预期盈余充足时，预支库存40/50抽（视情报书而定）配合卡池赠送凑够60抽，触发寻访情报书为下个卡池准备。盈余计算：库存+卡池赠送(10)+情报书(10/0)+下版本收入-阈值，需盈余>40/50抽。',
    defaultEnabled: false,
  },
  {
    id: 'A4',
    name: 'A4: 最后版本用光所有资源',
    description: '在规划的最后一个版本的最后一个卡池，无视基础策略阈值，强制进入并用光所有剩余库存抽数，不留盈余。优先级最高。',
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
  const [showMechanism, setShowMechanism] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">策略选择</h3>
          <button
            type="button"
            onClick={() => setShowMechanism(true)}
            className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 text-xs"
            title="查看卡池机制说明"
          >
            <InformationCircleIcon className="h-5 w-5" />
            <span>卡池机制</span>
          </button>
        </div>

        <h4 className="text-xs font-medium text-gray-600 mb-2">基础策略</h4>
        <RadioCard
          options={baseStrategyOptions}
          value={baseStrategy}
          onChange={(id) => onBaseStrategyChange(id as 'S1' | 'S2')}
          gridCols={2}
          disabled={disabled}
        />
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-600 mb-2">附加策略</h4>
        <CheckboxCard
          options={addonStrategyOptions}
          value={addonStrategies}
          onChange={(id, _checked) => onAddonStrategyToggle(id as 'A1' | 'A2' | 'A3' | 'A4')}
          disabled={disabled}
        />
      </div>

      <MechanismDialog
        isOpen={showMechanism}
        onClose={() => setShowMechanism(false)}
      />
    </div>
  );
}
