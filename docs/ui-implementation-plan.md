# UI重构实现计划

## 概述

基于新的UI设计规范，对现有简单表单进行全面重构，实现现代化、交互友好的用户界面。

---

## 实施阶段

### Phase 1: 基础组件库 (预计2-3小时)

#### 1.1 安装依赖

```bash
npm install --save \
  @headlessui/react \
  @heroicons/react \
  recharts \
  clsx
```

#### 1.2 创建基础组件

**文件结构**：
```
src/
├── components/
│   ├── ui/
│   │   ├── NumberInput.tsx       # 数字输入框
│   │   ├── RangeSlider.tsx       # 范围滑块
│   │   ├── Select.tsx            # 下拉选择器
│   │   ├── RadioCard.tsx         # 单选卡片
│   │   ├── CheckboxCard.tsx      # 多选卡片
│   │   ├── Button.tsx            # 按钮
│   │   └── Card.tsx              # 卡片容器
│   ├── forms/
│   │   ├── ResourceInputs.tsx    # 当前资源输入组
│   │   ├── PlanningInputs.tsx    # 规划配置输入组
│   │   ├── StrategySelector.tsx  # 策略选择器
│   │   └── SimulationSettings.tsx # 模拟设置
│   ├── results/
│   │   ├── MetricsCards.tsx      # 核心指标卡片
│   │   ├── ConsumptionStats.tsx  # 资源消耗统计
│   │   └── DistributionChart.tsx # 分布图表
│   └── layout/
│       ├── Header.tsx            # 页面头部
│       ├── InputPanel.tsx        # 输入面板
│       └── ResultPanel.tsx       # 结果面板
└── styles/
    └── globals.css               # 全局样式（Tailwind）
```

#### 1.3 组件实现优先级

**第1批（核心输入）**：
1. NumberInput.tsx - 数字输入框
2. Button.tsx - 按钮组件
3. Card.tsx - 卡片容器
4. ResourceInputs.tsx - 资源输入组

**第2批（交互组件）**：
5. RangeSlider.tsx - 范围滑块
6. Select.tsx - 下拉选择器
7. PlanningInputs.tsx - 规划配置组

**第3批（策略选择）**：
8. RadioCard.tsx - 单选卡片
9. CheckboxCard.tsx - 多选卡片
10. StrategySelector.tsx - 策略选择器

---

### Phase 2: 状态管理重构 (预计1-2小时)

#### 2.1 创建类型定义

**文件**: `src/types/ui.ts`

```typescript
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
  };

  // 模拟设置
  trials: 1000 | 5000 | 20000;

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
```

#### 2.2 实现状态Hook

**文件**: `src/hooks/useSimulatorState.ts`

```typescript
import { useState, useCallback } from 'react';
import type { SimulatorUIState, ValidationErrors } from '@/types/ui';

export function useSimulatorState() {
  const [state, setState] = useState<SimulatorUIState>({
    // 默认值
    currentPulls: 0,
    currentArsenal: 0,
    pullsPerVersion: 50,
    arsenalPerVersion: 1000,
    versionCount: 3,
    bannersPerVersion: 2,
    baseStrategy: 'S1',
    addonStrategies: {
      A1: true,
      A2: false,
      A3: false,
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
    setState(prev => ({ ...prev, [key]: value }));
    // 清除该字段的错误
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key as keyof ValidationErrors];
      return newErrors;
    });
  }, []);

  // 更新策略
  const updateBaseStrategy = useCallback((strategy: 'S1' | 'S2') => {
    setState(prev => ({ ...prev, baseStrategy: strategy }));
  }, []);

  const toggleAddonStrategy = useCallback((id: 'A1' | 'A2' | 'A3') => {
    setState(prev => ({
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
```

---

### Phase 3: UI组件实现 (预计4-6小时)

#### 3.1 NumberInput组件

**文件**: `src/components/ui/NumberInput.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  tooltip?: string;
  error?: string;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  tooltip,
  error,
  disabled = false,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= min && (max === undefined || numValue <= max)) {
      onChange(Math.floor(numValue)); // 只接受整数
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(displayValue);
    if (isNaN(numValue) || numValue < min) {
      onChange(min);
    } else if (max !== undefined && numValue > max) {
      onChange(max);
    } else {
      onChange(Math.floor(numValue));
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {tooltip && (
          <span className="ml-2 text-gray-400" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <input
        id={label}
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          'w-full px-4 py-3 rounded-lg border-2 transition-all',
          'text-base font-medium',
          'focus:outline-none',
          error
            ? 'border-red-500 focus:border-red-500'
            : isFocused
            ? 'border-blue-500'
            : 'border-gray-200 hover:border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">⚠ {error}</p>
      )}
    </div>
  );
}
```

#### 3.2 RangeSlider组件

**文件**: `src/components/ui/RangeSlider.tsx`

```typescript
import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showMarks?: boolean;
  formatter?: (value: number) => string;
  warning?: string;
}

export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showMarks = true,
  formatter,
  warning,
}: RangeSliderProps) {
  const displayValue = formatter ? formatter(value) : String(value);
  const marks = showMarks ? Array.from(
    { length: Math.floor((max - min) / step) + 1 },
    (_, i) => min + i * step
  ) : [];

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-2xl font-bold text-blue-600">
          {displayValue}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-500
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-600
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-blue-500
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:hover:bg-blue-600
                   [&::-moz-range-thumb]:border-0"
      />

      {showMarks && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {marks.map((mark) => (
            <span key={mark}>{formatter ? formatter(mark) : mark}</span>
          ))}
        </div>
      )}

      {warning && (
        <div className="mt-2 flex items-center text-sm text-amber-600">
          <span className="mr-1">⚠️</span>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
```

#### 3.3 RadioCard组件（基础策略）

**文件**: `src/components/ui/RadioCard.tsx`

```typescript
import React from 'react';
import clsx from 'clsx';

export interface RadioOption {
  id: string;
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

interface RadioCardProps {
  options: RadioOption[];
  value: string;
  onChange: (id: string) => void;
  gridCols?: number;
}

export function RadioCard({
  options,
  value,
  onChange,
  gridCols = 2,
}: RadioCardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${gridCols} gap-4`}>
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <label
            key={option.id}
            className={clsx(
              'relative flex cursor-pointer rounded-xl border-2 p-5 transition-all',
              'hover:shadow-md',
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            )}
          >
            <input
              type="radio"
              name="radio-card"
              value={option.id}
              checked={isSelected}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <div className="flex w-full flex-col">
              <div className="flex items-center mb-2">
                <div
                  className={clsx(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 mr-3',
                    isSelected ? 'border-blue-500' : 'border-gray-300'
                  )}
                >
                  {isSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {option.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {option.description}
              </p>
              {option.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {Object.entries(option.metadata).map(([key, val]) => (
                    <div key={key} className="text-xs text-gray-500">
                      <span className="font-medium">{key}:</span> {String(val)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
```

#### 3.4 CheckboxCard组件（附加策略）

**文件**: `src/components/ui/CheckboxCard.tsx`

```typescript
import React from 'react';
import clsx from 'clsx';

export interface CheckboxOption {
  id: string;
  name: string;
  description: string;
  defaultEnabled?: boolean;
}

interface CheckboxCardProps {
  options: CheckboxOption[];
  value: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
}

export function CheckboxCard({
  options,
  value,
  onChange,
}: CheckboxCardProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isChecked = value[option.id] || false;
        return (
          <label
            key={option.id}
            className={clsx(
              'relative flex cursor-pointer rounded-lg border p-4 transition-all',
              'hover:shadow-sm',
              isChecked
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(option.id, e.target.checked)}
              className="sr-only"
            />
            <div className="flex w-full items-start">
              <div
                className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded border-2 mr-3 mt-0.5',
                  isChecked
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white'
                )}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-semibold text-gray-900">
                    {option.name}
                  </span>
                  {option.defaultEnabled && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                      默认开启
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
```

---

### Phase 4: 页面布局整合 (预计2-3小时)

#### 4.1 主页面结构

**文件**: `src/pages/SimulatorPage.tsx`

```typescript
import React from 'react';
import { useSimulatorState } from '@/hooks/useSimulatorState';
import { Header } from '@/components/layout/Header';
import { InputPanel } from '@/components/layout/InputPanel';
import { ResultPanel } from '@/components/layout/ResultPanel';

export function SimulatorPage() {
  const {
    state,
    validationErrors,
    updateNumber,
    updateBaseStrategy,
    toggleAddonStrategy,
    validate,
    setState,
  } = useSimulatorState();

  const handleStartSimulation = async () => {
    if (!validate()) {
      return;
    }

    setState(prev => ({ ...prev, isRunning: true, progress: 0, error: null }));

    // 调用模拟引擎...
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：输入面板 */}
          <InputPanel
            state={state}
            errors={validationErrors}
            onNumberChange={updateNumber}
            onBaseStrategyChange={updateBaseStrategy}
            onAddonStrategyToggle={toggleAddonStrategy}
            onStartSimulation={handleStartSimulation}
            onCancel={() => {/* 取消逻辑 */}}
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
```

#### 4.2 InputPanel组件

**文件**: `src/components/layout/InputPanel.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/Card';
import { ResourceInputs } from '@/components/forms/ResourceInputs';
import { PlanningInputs } from '@/components/forms/PlanningInputs';
import { StrategySelector } from '@/components/forms/StrategySelector';
import { SimulationSettings } from '@/components/forms/SimulationSettings';

export function InputPanel({ state, errors, ... }) {
  return (
    <div className="space-y-6">
      {/* 第一部分：当前资源 */}
      <Card title="当前资源">
        <ResourceInputs
          currentPulls={state.currentPulls}
          currentArsenal={state.currentArsenal}
          errors={errors}
          onChange={onNumberChange}
        />
      </Card>

      {/* 第二部分：规划配置 */}
      <Card title="规划配置">
        <PlanningInputs
          pullsPerVersion={state.pullsPerVersion}
          arsenalPerVersion={state.arsenalPerVersion}
          versionCount={state.versionCount}
          bannersPerVersion={state.bannersPerVersion}
          errors={errors}
          onChange={onNumberChange}
        />
      </Card>

      {/* 第三部分：策略选择 */}
      <Card title="策略选择">
        <StrategySelector
          baseStrategy={state.baseStrategy}
          addonStrategies={state.addonStrategies}
          onBaseStrategyChange={onBaseStrategyChange}
          onAddonStrategyToggle={onAddonStrategyToggle}
        />
      </Card>

      {/* 第四部分：模拟设置 */}
      <Card title="模拟设置">
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
```

---

### Phase 5: 结果可视化 (预计3-4小时)

#### 5.1 核心指标卡片

**文件**: `src/components/results/MetricsCards.tsx`

```typescript
import React from 'react';
import type { SimOutput } from '@/sim/types';

interface MetricsCardsProps {
  result: SimOutput;
  totalBanners: number;
}

export function MetricsCards({ result, totalBanners }: MetricsCardsProps) {
  // 从debug note中解析数据
  const parseNote = (note: string) => {
    const match = note.match(
      /角色期望: ([\d.]+)\/([\d]+) \| 专武期望: ([\d.]+)\/([\d]+) \| 角色覆盖率: ([\d.]+)% \| 专武覆盖率: ([\d.]+)%/
    );
    if (!match) return null;
    return {
      charExpected: parseFloat(match[1]),
      charTotal: parseInt(match[2]),
      weaponExpected: parseFloat(match[3]),
      weaponTotal: parseInt(match[4]),
      charCoverage: parseFloat(match[5]),
      weaponCoverage: parseFloat(match[6]),
    };
  };

  const data = parseNote(result.debug.note);
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard
        title="角色获取期望"
        value={`${data.charExpected.toFixed(2)} / ${data.charTotal}`}
        percentage={((data.charExpected / data.charTotal) * 100).toFixed(1)}
        color="blue"
      />
      <MetricCard
        title="专武获取期望"
        value={`${data.weaponExpected.toFixed(2)} / ${data.weaponTotal}`}
        percentage={((data.weaponExpected / data.weaponTotal) * 100).toFixed(1)}
        color="purple"
      />
      <MetricCard
        title="角色完全覆盖率"
        value={`${data.charCoverage.toFixed(1)}%`}
        subtitle={`在${result.debug.inputEcho.trials}次中`}
        color="green"
      />
      <MetricCard
        title="专武完全覆盖率"
        value={`${data.weaponCoverage.toFixed(1)}%`}
        subtitle={`在${result.debug.inputEcho.trials}次中`}
        color="amber"
      />
    </div>
  );
}

function MetricCard({ title, value, percentage, subtitle, color }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    green: 'from-green-50 to-green-100 border-green-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
  };

  return (
    <div
      className={`rounded-xl border p-6 bg-gradient-to-br ${colorClasses[color]} shadow-sm`}
    >
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {percentage && (
        <div className="text-lg text-gray-700 mt-1">({percentage}%)</div>
      )}
      {subtitle && (
        <div className="text-xs text-gray-500 mt-2">{subtitle}</div>
      )}
    </div>
  );
}
```

#### 5.2 分布图表

**文件**: `src/components/results/DistributionChart.tsx`

```typescript
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DistributionChartProps {
  title: string;
  data: number[]; // 每个trial获得的角色/专武数量
  maxValue: number; // 总卡池数
}

export function DistributionChart({
  title,
  data,
  maxValue,
}: DistributionChartProps) {
  const chartData = useMemo(() => {
    // 统计每个数量的出现频次
    const counts = new Map<number, number>();
    for (let i = 0; i <= maxValue; i++) {
      counts.set(i, 0);
    }
    data.forEach((count) => {
      counts.set(count, (counts.get(count) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([count, frequency]) => ({
      label: `${count}个`,
      count,
      frequency,
      percentage: ((frequency / data.length) * 100).toFixed(1),
    }));
  }, [data, maxValue]);

  const maxFrequency = Math.max(...chartData.map((d) => d.frequency));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#e5e7eb"
            label={{
              value: '出现频次',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6b7280', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value, name, props) => [
              `${value}次 (${props.payload.percentage}%)`,
              '出现频次',
            ]}
          />
          <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.frequency === maxFrequency ? '#2563eb' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

### Phase 6: 样式与主题 (预计1-2小时)

#### 6.1 Tailwind配置

**文件**: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
```

#### 6.2 全局样式

**文件**: `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply box-border;
  }

  html {
    @apply antialiased;
  }

  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm;
  }

  .btn-primary {
    @apply px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600
           text-white font-semibold rounded-lg
           shadow-md hover:shadow-lg
           transition-all
           disabled:opacity-50 disabled:cursor-not-allowed
           active:scale-98;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-white border border-gray-300
           text-gray-700 font-medium rounded-lg
           hover:bg-gray-50
           transition-all;
  }
}

@layer utilities {
  .active\:scale-98:active {
    transform: scale(0.98);
  }
}
```

---

### Phase 7: 测试与优化 (预计2-3小时)

#### 7.1 单元测试

- 测试各个UI组件的渲染和交互
- 测试表单验证逻辑
- 测试状态管理Hook

#### 7.2 集成测试

- 测试完整的用户流程
- 测试模拟运行和结果展示

#### 7.3 性能优化

- 使用React.memo优化组件
- 使用useMemo/useCallback优化计算
- 虚拟化长列表（如果需要）

#### 7.4 响应式测试

- 测试移动端布局
- 测试平板布局
- 测试桌面布局

---

## 时间估算总结

| 阶段 | 任务 | 预计时间 |
|-----|------|---------|
| Phase 1 | 基础组件库 | 2-3小时 |
| Phase 2 | 状态管理重构 | 1-2小时 |
| Phase 3 | UI组件实现 | 4-6小时 |
| Phase 4 | 页面布局整合 | 2-3小时 |
| Phase 5 | 结果可视化 | 3-4小时 |
| Phase 6 | 样式与主题 | 1-2小时 |
| Phase 7 | 测试与优化 | 2-3小时 |
| **总计** | | **15-23小时** |

---

## 实施建议

### 开发顺序

1. **先搭基础**：Phase 1 → Phase 2
2. **再做输入**：Phase 3 (输入组件) → Phase 4
3. **最后可视化**：Phase 5 → Phase 6
4. **持续优化**：Phase 7 贯穿整个过程

### 里程碑

**里程碑1 (完成Phase 1-2)**：
- 可以输入基本参数
- 可以选择策略
- 可以启动模拟

**里程碑2 (完成Phase 3-4)**：
- 完整的输入面板
- 美观的策略选择器
- 良好的交互体验

**里程碑3 (完成Phase 5-6)**：
- 完整的结果展示
- 精美的图表可视化
- 统一的设计风格

---

## 下一步行动

1. 安装必要依赖
2. 创建组件文件结构
3. 从NumberInput开始实现基础组件
4. 逐步构建完整UI

**准备好开始实施了吗？**
