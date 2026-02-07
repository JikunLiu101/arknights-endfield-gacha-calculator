
import { Card } from '../ui/Card';
import { ResourceInputs } from '../forms/ResourceInputs';
import { PlanningInputs } from '../forms/PlanningInputs';
import { StrategySelector } from '../forms/StrategySelector';
import { SimulationSettings } from '../forms/SimulationSettings';
import type { SimulatorUIState, ValidationErrors } from '../../types/ui';

interface InputPanelProps {
  state: SimulatorUIState;
  errors: ValidationErrors;
  onNumberChange: (key: string, value: number) => void;
  onBooleanChange: (key: string, value: boolean) => void;
  onBaseStrategyChange: (strategy: 'S1' | 'S2') => void;
  onAddonStrategyToggle: (id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5') => void;
  onStartSimulation: () => void;
  onCancel: () => void;
}

export function InputPanel({
  state,
  errors,
  onNumberChange,
  onBooleanChange,
  onBaseStrategyChange,
  onAddonStrategyToggle,
  onStartSimulation,
  onCancel,
}: InputPanelProps) {
  return (
    <div className="space-y-6">
      {/* 第一部分：当前资源 */}
      <Card title="当前资源" colorScheme="blue">
        <ResourceInputs
          currentPulls={state.currentPulls}
          currentArsenal={state.currentArsenal}
          errors={errors}
          onChange={onNumberChange}
          disabled={state.isRunning}
        />
      </Card>

      {/* 第二部分：规划配置 */}
      <Card title="规划配置" colorScheme="purple">
        <PlanningInputs
          pullsPerVersion={state.pullsPerVersion}
          arsenalPerVersion={state.arsenalPerVersion}
          versionCount={state.versionCount}
          bannersPerVersion={state.bannersPerVersion}
          excludeFirstVersionResources={state.excludeFirstVersionResources}
          errors={errors}
          onChange={onNumberChange}
          onToggleExcludeFirstVersionResources={(checked) =>
            onBooleanChange('excludeFirstVersionResources', checked)
          }
          disabled={state.isRunning}
        />
      </Card>

      {/* 第三部分：策略选择 */}
      <Card title="策略选择" colorScheme="amber">
        <StrategySelector
          baseStrategy={state.baseStrategy}
          addonStrategies={state.addonStrategies}
          onBaseStrategyChange={onBaseStrategyChange}
          onAddonStrategyToggle={onAddonStrategyToggle}
          disabled={state.isRunning}
        />
      </Card>

      {/* 第四部分：模拟设置 */}
      <Card title="模拟设置" colorScheme="rose">
        <SimulationSettings
          trials={state.trials}
          isRunning={state.isRunning}
          progress={state.progress}
          onTrialsChange={(value) => onNumberChange('trials', value)}
          onStart={onStartSimulation}
          onCancel={onCancel}
        />
      </Card>
    </div>
  );
}
