import { useCallback, useRef } from 'react';
import { useSimulatorState } from './hooks/useSimulatorState';
import { Header } from './components/layout/Header';
import { InputPanel } from './components/layout/InputPanel';
import { ResultPanel } from './components/layout/ResultPanel';
import type { SimInput } from './sim/types';
import type { WorkerRunRequest, WorkerResponse } from './sim/types';

export function App() {
  const {
    state,
    validationErrors,
    updateNumber,
    updateBaseStrategy,
    toggleAddonStrategy,
    validate,
    setState,
  } = useSimulatorState();

  const workerRef = useRef<Worker | null>(null);

  const handleStartSimulation = useCallback(async () => {
    // Validate inputs
    if (!validate()) {
      return;
    }

    // Build SimInput from state
    const input: SimInput = {
      currentPulls: state.currentPulls,
      pullsPerVersion: state.pullsPerVersion,
      arsenalPerVersion: state.arsenalPerVersion,
      versionCount: state.versionCount,
      bannersPerVersion: state.bannersPerVersion,
      strategyId: state.baseStrategy,
      trials: state.trials,
      seed: null, // No seed for real simulations
    };

    // Start running state
    setState((prev) => ({
      ...prev,
      isRunning: true,
      progress: 0,
      error: null,
      result: null,
    }));

    try {
      // Create worker
      const worker = new Worker(
        new URL('./sim/sim.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // Handle worker messages
      worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
        const msg = ev.data;

        if (msg.type === 'progress') {
          const progressPercent = (msg.done / msg.total) * 100;
          setState((prev) => ({ ...prev, progress: progressPercent }));
        } else if (msg.type === 'result') {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            progress: 100,
            result: msg.output,
          }));
          worker.terminate();
          workerRef.current = null;
        } else if (msg.type === 'error') {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            progress: 0,
            error: msg.message,
          }));
          worker.terminate();
          workerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setState((prev) => ({
          ...prev,
          isRunning: false,
          progress: 0,
          error: '模拟运行出错',
        }));
        worker.terminate();
        workerRef.current = null;
      };

      // Send run request
      const request: WorkerRunRequest = { type: 'run', input };
      worker.postMessage(request);
    } catch (err) {
      console.error('Failed to start worker:', err);
      setState((prev) => ({
        ...prev,
        isRunning: false,
        progress: 0,
        error: '无法启动模拟',
      }));
    }
  }, [state, validate, setState]);

  const handleCancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
      progress: 0,
    }));
  }, [setState]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <strong className="font-semibold">错误: </strong>
            <span>{state.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：输入面板 */}
          <InputPanel
            state={state}
            errors={validationErrors}
            onNumberChange={updateNumber}
            onBaseStrategyChange={updateBaseStrategy}
            onAddonStrategyToggle={toggleAddonStrategy}
            onStartSimulation={handleStartSimulation}
            onCancel={handleCancel}
          />

          {/* 右侧：结果面板 */}
          <ResultPanel
            result={state.result}
            isRunning={state.isRunning}
            progress={state.progress}
          />
        </div>
      </main>
    </div>
  );
}
