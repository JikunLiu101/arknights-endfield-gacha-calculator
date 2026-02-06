
import { RangeSlider } from '../ui/RangeSlider';
import { Button } from '../ui/Button';

interface SimulationSettingsProps {
  trials: 1000 | 5000 | 20000;
  isRunning: boolean;
  progress: number;
  onTrialsChange: (value: number) => void;
  onStart: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

const trialsOptions = [1000, 5000, 20000];

export function SimulationSettings({
  trials,
  isRunning,
  progress,
  onTrialsChange,
  onStart,
  onCancel,
  disabled = false,
}: SimulationSettingsProps) {
  // Find index of current trials in options array
  const currentIndex = trialsOptions.indexOf(trials);
  const sliderValue = currentIndex !== -1 ? currentIndex : 1;

  const handleSliderChange = (index: number) => {
    onTrialsChange(trialsOptions[index]);
  };

  const getWarning = () => {
    if (trials === 20000) {
      return '可能需要较长时间';
    }
    return undefined;
  };

  return (
    <div className="space-y-5">
      <RangeSlider
        label="模拟次数"
        value={sliderValue}
        min={0}
        max={trialsOptions.length - 1}
        step={1}
        onChange={handleSliderChange}
        formatter={(index) => {
          const value = trialsOptions[index];
          return `${value.toLocaleString()}次`;
        }}
        showMarks={true}
        warning={getWarning()}
        disabled={isRunning || disabled}
      />

      {isRunning && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">模拟进度</span>
            <span className="font-semibold text-blue-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            已完成: {Math.floor((progress / 100) * trials).toLocaleString()} / {trials.toLocaleString()}次
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!isRunning ? (
          <Button
            onClick={onStart}
            variant="primary"
            fullWidth
            disabled={disabled}
          >
            开始模拟
          </Button>
        ) : (
          <>
            <Button
              onClick={onCancel}
              variant="secondary"
              fullWidth
            >
              取消
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
