import { TopUpInputPanel } from './TopUpInputPanel';
import { TopUpResultPanel } from './TopUpResultPanel';
import type { SimulatorUIState, ValidationErrors } from '../../types/ui';

interface TopUpPlannerPageProps {
  state: SimulatorUIState;
  errors: ValidationErrors;
  onNumberChange: (key: string, value: number) => void;
  onBooleanChange: (key: string, value: boolean) => void;
  onStartSimulation: () => void;
  onCancel: () => void;
}

export function TopUpPlannerPage({
  state,
  errors,
  onNumberChange,
  onBooleanChange,
  onStartSimulation,
  onCancel,
}: TopUpPlannerPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <TopUpInputPanel
        state={state}
        errors={errors}
        onNumberChange={onNumberChange}
        onBooleanChange={onBooleanChange}
        onStartSimulation={onStartSimulation}
        onCancel={onCancel}
      />

      <TopUpResultPanel
        result={state.topUpResult}
        isRunning={state.topUpIsRunning}
        progress={state.topUpProgress}
      />
    </div>
  );
}
