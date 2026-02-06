import { useState, useCallback } from 'react';
import type { SimulatorUIState, ValidationErrors } from '../types/ui';

export function useSimulatorState() {
  const [state, setState] = useState<SimulatorUIState>({
    // 默认值
    currentPulls: 0,
    currentArsenal: 0,
    pullsPerVersion: 60,
    arsenalPerVersion: 1980,
    versionCount: 6,
    bannersPerVersion: 2,
    baseStrategy: 'S1',
    addonStrategies: {
      A1: true,
      A2: false,
      A3: false,
      A4: false,
      A5: true,
    },
    trials: 5000,
    isRunning: false,
    progress: 0,
    error: null,
    result: null,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // 更新数字输入
  const updateNumber = useCallback((key: string, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
    // 清除该字段的错误
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key as keyof ValidationErrors];
      return newErrors;
    });
  }, []);

  // 更新基础策略
  const updateBaseStrategy = useCallback((strategy: 'S1' | 'S2') => {
    setState((prev) => ({ ...prev, baseStrategy: strategy }));
  }, []);

  // 切换附加策略
  const toggleAddonStrategy = useCallback((id: 'A1' | 'A2' | 'A3' | 'A4' | 'A5') => {
    setState((prev) => ({
      ...prev,
      addonStrategies: {
        ...prev.addonStrategies,
        [id]: !prev.addonStrategies[id],
      },
    }));
  }, []);

  // 验证输入
  const validate = useCallback(() => {
    const errors: ValidationErrors = {};

    if (state.currentPulls < 0) {
      errors.currentPulls = '当前角色抽数不能为负数';
    }
    if (state.currentArsenal < 0) {
      errors.currentArsenal = '当前武库配额不能为负数';
    }
    if (state.pullsPerVersion < 0) {
      errors.pullsPerVersion = '每版本抽数不能为负数';
    }
    if (state.arsenalPerVersion < 0) {
      errors.arsenalPerVersion = '每版本配额不能为负数';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [state]);

  return {
    state,
    validationErrors,
    updateNumber,
    updateBaseStrategy,
    toggleAddonStrategy,
    validate,
    setState,
  };
}
