import type { SimOutput } from '../sim/types';

export interface SimulatorUIState {
  // 当前资源
  currentPulls: number;
  currentArsenal: number;

  // 规划配置
  pullsPerVersion: number;
  arsenalPerVersion: number;
  versionCount: number; // 1-8
  bannersPerVersion: number; // 1-3

  // 策略选择
  baseStrategy: 'S1' | 'S2';
  addonStrategies: {
    A1: boolean;
    A2: boolean;
    A3: boolean;
    A4: boolean;
  };

  // 模拟设置
  trials: 1000 | 5000 | 10000 | 20000;

  // 运行状态
  isRunning: boolean;
  progress: number; // 0-100
  error: string | null;

  // 结果
  result: SimOutput | null;
}

export interface ValidationErrors {
  currentPulls?: string;
  currentArsenal?: string;
  pullsPerVersion?: string;
  arsenalPerVersion?: string;
}
