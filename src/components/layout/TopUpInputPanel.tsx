import { Card } from '../ui/Card';
import { ResourceInputs } from '../forms/ResourceInputs';
import { PlanningInputs } from '../forms/PlanningInputs';
import { SimulationSettings } from '../forms/SimulationSettings';
import { RadioCard } from '../ui/RadioCard';
import type { SimulatorUIState, ValidationErrors } from '../../types/ui';

interface TopUpInputPanelProps {
  state: SimulatorUIState;
  errors: ValidationErrors;
  onNumberChange: (key: string, value: number) => void;
  onStartSimulation: () => void;
  onCancel: () => void;
}

export function TopUpInputPanel({
  state,
  errors,
  onNumberChange,
  onStartSimulation,
  onCancel,
}: TopUpInputPanelProps) {
  return (
    <div className="space-y-6">
      <Card title="当前资源" colorScheme="blue">
        <ResourceInputs
          currentPulls={state.currentPulls}
          currentArsenal={state.currentArsenal}
          errors={errors}
          onChange={onNumberChange}
          disabled={state.topUpIsRunning}
        />
      </Card>

      <Card title="规划配置" colorScheme="purple">
        <PlanningInputs
          pullsPerVersion={state.pullsPerVersion}
          arsenalPerVersion={state.arsenalPerVersion}
          versionCount={state.versionCount}
          bannersPerVersion={state.bannersPerVersion}
          errors={errors}
          onChange={onNumberChange}
          disabled={state.topUpIsRunning}
        />
      </Card>

      <Card title="策略选择" colorScheme="amber">
        <RadioCard
          options={[
            {
              id: 'COLLECTION_0P1',
              name: '全图鉴 0+1',
              description:
                '每个角色池抽到UP才收手；每个武器池抽到专武才收手。该分页的充值估算不计入“可能获得”的加急寻访与寻访情报书。',
            },
          ]}
          value="COLLECTION_0P1"
          onChange={() => {
            // 仅一个选项，保持选中
          }}
          gridCols={1}
          disabled={state.topUpIsRunning}
        />
      </Card>

      <Card title="模拟设置" colorScheme="rose">
        <SimulationSettings
          trials={state.trials}
          isRunning={state.topUpIsRunning}
          progress={state.topUpProgress}
          onTrialsChange={(value) => onNumberChange('trials', value)}
          onStart={onStartSimulation}
          onCancel={onCancel}
        />
      </Card>
    </div>
  );
}
