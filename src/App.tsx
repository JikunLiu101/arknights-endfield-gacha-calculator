import { useCallback, useRef, useState } from 'react';
import { useSimulatorState } from './hooks/useSimulatorState';
import { Header } from './components/layout/Header';
import { InputPanel } from './components/layout/InputPanel';
import { ResultPanel } from './components/layout/ResultPanel';
import { TopUpPlannerPage } from './components/layout/TopUpPlannerPage';
import type { SimInput, StrategyConfig } from './sim/types';
import type { WorkerRunRequest, WorkerResponse } from './sim/types';
import { createDefaultStrategyConfig } from './sim/strategies';

type PageId = 'collection-probability' | 'topup-planner';

export function App() {
  const [activePage, setActivePage] = useState<PageId>(
    'collection-probability'
  );

  const {
    state,
    validationErrors,
    updateNumber,
    updateBoolean,
    updateBaseStrategy,
    toggleAddonStrategy,
    validate,
    setState,
  } = useSimulatorState();

  const workerRef = useRef<Worker | null>(null);
  const topUpWorkerRef = useRef<Worker | null>(null);

  const handleStartSimulation = useCallback(async () => {
    // Validate inputs
    if (!validate()) {
      return;
    }

    // Build StrategyConfig from UI state
    const defaultStrategyConfig = createDefaultStrategyConfig(state.baseStrategy);

    const strategyConfig: StrategyConfig = {
      ...defaultStrategyConfig,
      addonStrategies: {
        ...defaultStrategyConfig.addonStrategies,
        A1_alwaysUseIntelReport: state.addonStrategies.A1,
        A2_pullForFastTrack: state.addonStrategies.A2,
        A3_pullForIntelReport: state.addonStrategies.A3,
        A4_useAllInLastVersion: state.addonStrategies.A4,
        A5_weaponSparkPriority: state.addonStrategies.A5,
      },
    };

    // Build SimInput from state
    const input: SimInput = {
      currentPulls: state.currentPulls,
      currentArsenal: state.currentArsenal,
      pullsPerVersion: state.pullsPerVersion,
      arsenalPerVersion: state.arsenalPerVersion,
      versionCount: state.versionCount,
      bannersPerVersion: state.bannersPerVersion,
      excludeFirstVersionResources: state.excludeFirstVersionResources,
      strategyId: state.baseStrategy,
      strategyConfig: strategyConfig,
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

  const handleStartTopUpSimulation = useCallback(async () => {
    if (!validate()) {
      return;
    }

    const input: SimInput = {
      currentPulls: state.currentPulls,
      currentArsenal: state.currentArsenal,
      pullsPerVersion: state.pullsPerVersion,
      arsenalPerVersion: state.arsenalPerVersion,
      versionCount: state.versionCount,
      bannersPerVersion: state.bannersPerVersion,
      excludeFirstVersionResources: state.excludeFirstVersionResources,
      strategyId: state.baseStrategy,
      strategyConfig: undefined,
      trials: state.trials,
      seed: null,
    };

    setState((prev) => ({
      ...prev,
      topUpIsRunning: true,
      topUpProgress: 0,
      topUpError: null,
      topUpResult: null,
    }));

    try {
      const worker = new Worker(
        new URL('./sim/sim.worker.ts', import.meta.url),
        { type: 'module' }
      );
      topUpWorkerRef.current = worker;

      worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
        const msg = ev.data;

        if (msg.type === 'progress') {
          const progressPercent = (msg.done / msg.total) * 100;
          setState((prev) => ({ ...prev, topUpProgress: progressPercent }));
        } else if (msg.type === 'resultTopUp') {
          setState((prev) => ({
            ...prev,
            topUpIsRunning: false,
            topUpProgress: 100,
            topUpResult: msg.output,
          }));
          worker.terminate();
          topUpWorkerRef.current = null;
        } else if (msg.type === 'error') {
          setState((prev) => ({
            ...prev,
            topUpIsRunning: false,
            topUpProgress: 0,
            topUpError: msg.message,
          }));
          worker.terminate();
          topUpWorkerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setState((prev) => ({
          ...prev,
          topUpIsRunning: false,
          topUpProgress: 0,
          topUpError: '模拟运行出错',
        }));
        worker.terminate();
        topUpWorkerRef.current = null;
      };

      worker.postMessage({ type: 'runTopUp', input });
    } catch (err) {
      console.error('Failed to start worker:', err);
      setState((prev) => ({
        ...prev,
        topUpIsRunning: false,
        topUpProgress: 0,
        topUpError: '无法启动模拟',
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

  const handleCancelTopUp = useCallback(() => {
    if (topUpWorkerRef.current) {
      topUpWorkerRef.current.terminate();
      topUpWorkerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      topUpIsRunning: false,
      topUpProgress: 0,
    }));
  }, [setState]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 分页切换（两个分页都保持挂载，切换时状态会保留） */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActivePage('collection-probability')}
              className={
                activePage === 'collection-probability'
                  ? 'px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 text-gray-900'
                  : 'px-4 py-2 rounded-lg font-semibold text-sm bg-white/60 border border-gray-200 text-gray-600 hover:bg-white'
              }
              aria-current={
                activePage === 'collection-probability' ? 'page' : undefined
              }
            >
              看看你的全图鉴概率
            </button>

            <button
              type="button"
              onClick={() => setActivePage('topup-planner')}
              className={
                activePage === 'topup-planner'
                  ? 'px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 text-gray-900'
                  : 'px-4 py-2 rounded-lg font-semibold text-sm bg-white/60 border border-gray-200 text-gray-600 hover:bg-white'
              }
              aria-current={activePage === 'topup-planner' ? 'page' : undefined}
            >
              要充多少抽才能拿下后续全图鉴？
            </button>
          </div>
        </div>

        {/* Page 1: 原有页面布局（除 Header） */}
        <section
          className={activePage === 'collection-probability' ? '' : 'hidden'}
          aria-hidden={activePage !== 'collection-probability'}
        >
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
              onBooleanChange={updateBoolean}
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
        </section>

        {/* Page 2: 充值/补抽估算页 */}
        <section
          className={activePage === 'topup-planner' ? '' : 'hidden'}
          aria-hidden={activePage !== 'topup-planner'}
        >
          {state.topUpError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <strong className="font-semibold">错误: </strong>
              <span>{state.topUpError}</span>
            </div>
          )}

          <TopUpPlannerPage
            state={state}
            errors={validationErrors}
            onNumberChange={updateNumber}
            onBooleanChange={updateBoolean}
            onStartSimulation={handleStartTopUpSimulation}
            onCancel={handleCancelTopUp}
          />
        </section>
      </main>
    </div>
  );
}
