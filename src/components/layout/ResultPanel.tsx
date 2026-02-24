import { Card } from '../ui/Card';
import { HoverBreakdown } from '../ui/HoverBreakdown';
import type { SimOutput } from '../../sim/types';
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

interface ResultPanelProps {
  result: SimOutput | null;
  isRunning: boolean;
  progress: number;
}

export function ResultPanel({ result, isRunning, progress }: ResultPanelProps) {
  if (isRunning) {
    return (
      <div className="space-y-6">
        <Card title="模拟进行中" colorScheme="cyan">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-lg font-semibold text-gray-100 mb-2">
              正在运行模拟...
            </p>
            <p className="text-sm text-gray-300">进度: {progress.toFixed(1)}%</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <Card title="模拟结果" colorScheme="indigo">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-semibold text-gray-100 mb-2">
              还没有运行模拟
            </p>
            <p className="text-sm text-gray-300">
              配置好参数后，点击"开始模拟"按钮查看结果
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 资源统计卡片 */}
      <Card title="资源统计" colorScheme="cyan" className="relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <HoverBreakdown lines={result.pullsBreakdownLines} title="角色抽数来源（按卡池）">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                角色抽数获取总计（期望）
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {(result.avgTotalPullsGained ?? result.totalPulls).toFixed(0)}
              </div>
            </div>
          </HoverBreakdown>

          <HoverBreakdown lines={result.arsenalBreakdownLines} title="武库配额来源（按卡池）">
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                平均获取武库配额
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.avgArsenalGained.toFixed(0)}
              </div>
            </div>
          </HoverBreakdown>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              平均花费角色抽数
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgPullsSpent.toFixed(0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              平均花费武库配额
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgArsenalSpent.toFixed(0)}
              <span className="text-sm text-gray-400 ml-1">
                ({result.avgArsenalClaims.toFixed(1)}申领)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 角色与专武统计 */}
      <Card title="角色与专武统计" colorScheme="green">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                期望获得限定角色
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.avgCharactersObtained.toFixed(2)} / {result.totalCharacters}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                期望获得专武
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.avgWeaponsObtained.toFixed(2)} / {result.totalWeapons}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                角色获取中位数
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.medianCharactersObtained}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                专武获取中位数
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.medianWeaponsObtained}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 角色获取分布 */}
      <Card title="限定角色获取分布" colorScheme="yellow">
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={result.characterDistribution}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="count"
                label={{ value: '获得角色数', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => value ? `${(value as number).toFixed(2)}%` : '0%'}
                labelFormatter={(label) => `获得 ${label} 个角色`}
                contentStyle={{ backgroundColor: '#1f2937' }}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {result.characterDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === result.medianCharactersObtained ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-200">
              {result.characterMedianSummary}
            </p>
            <p className="text-sm font-medium text-yellow-200">
              {result.characterCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>

      {/* 专武获取分布 */}
      <Card title="专武获取分布" colorScheme="rose">
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={result.weaponDistribution}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="count"
                label={{ value: '获得专武数', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => value ? `${(value as number).toFixed(2)}%` : '0%'}
                labelFormatter={(label) => `获得 ${label} 个专武`}
                contentStyle={{ backgroundColor: '#1f2937' }}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {result.weaponDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === result.medianWeaponsObtained ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-rose-900/30 border-rose-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-rose-200">
              {result.weaponMedianSummary}
            </p>
            <p className="text-sm font-medium text-rose-200">
              {result.weaponCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
