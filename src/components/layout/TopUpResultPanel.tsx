import { Card } from '../ui/Card';
import { HoverBreakdown } from '../ui/HoverBreakdown';
import type { TopUpSimOutput } from '../../sim/types';
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

interface TopUpResultPanelProps {
  result: TopUpSimOutput | null;
  isRunning: boolean;
  progress: number;
}

export function TopUpResultPanel({
  result,
  isRunning,
  progress,
}: TopUpResultPanelProps) {
  if (isRunning) {
    return (
      <div className="space-y-6">
        <Card title="模拟进行中" colorScheme="cyan">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              正在运行模拟...
            </p>
            <p className="text-sm text-gray-600">进度: {progress.toFixed(1)}%</p>
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
            <p className="text-lg font-semibold text-gray-900 mb-2">
              还没有运行模拟
            </p>
            <p className="text-sm text-gray-600">
              配置好参数后，点击"开始模拟"按钮查看充值估算
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const medianTopUpArsenalBucket =
    Math.floor(result.medianTopUpArsenal / 1000) * 1000;

  const formatClaims = (arsenal: number) => (arsenal / 1980).toFixed(1);

  return (
    <div className="space-y-6">
      <Card title="资源统计（不含充值）" colorScheme="blue">
        <div className="grid grid-cols-2 gap-4">
          <HoverBreakdown
            lines={result.pullsNoTopUpBreakdownLines}
            title="角色抽数来源（按卡池）"
          >
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                获得角色抽数总计（不充值）
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.totalPullsNoTopUp.toLocaleString()}
              </div>
            </div>
          </HoverBreakdown>

          <HoverBreakdown
            lines={result.arsenalNoTopUpBreakdownLines}
            title="武库配额来源（按卡池）"
          >
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                获得武库配额总计（不充值，期望）
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.avgArsenalGainedNoTopUp.toFixed(0)}
              </div>
            </div>
          </HoverBreakdown>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              花费角色抽数总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgPullsSpent.toFixed(1)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              花费武库配额总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgArsenalSpent.toFixed(0)}
            </div>
          </div>
        </div>
      </Card>

      <Card title="充值统计" colorScheme="purple">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              充值角色抽数总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgTopUpPulls.toFixed(1)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              充值武库配额总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgTopUpArsenal.toFixed(0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              充值角色抽数（中位数）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.medianTopUpPulls.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              充值武库配额（中位数）
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.medianTopUpArsenal.toLocaleString()} ({formatClaims(result.medianTopUpArsenal)}次)
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
        </div>
      </Card>

      <Card title="充值角色抽数分布" colorScheme="amber">
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={result.topUpPullsDistribution}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="count"
                label={{ value: '充值抽数', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) =>
                  value ? `${(value as number).toFixed(2)}%` : '0%'
                }
                labelFormatter={(label) => `充值 ${label} 抽`}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {result.topUpPullsDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.count === result.medianTopUpPulls ? '#f59e0b' : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900">
              {result.topUpPullsMedianSummary}
            </p>
            <p className="text-sm font-medium text-amber-900">
              {result.topUpPullsCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>

      <Card title="充值武库配额分布" colorScheme="rose">
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={result.topUpArsenalDistribution}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="count"
                label={{ value: '充值配额', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) =>
                  value ? `${(value as number).toFixed(2)}%` : '0%'
                }
                labelFormatter={(label) =>
                  `充值 ${Number(label).toLocaleString()} ~ ${(Number(label) + 999).toLocaleString()} 配额（约${formatClaims(Number(label))}~${formatClaims(Number(label) + 999)}次申领）`
                }
              />
              <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]}>
                {result.topUpArsenalDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.count === medianTopUpArsenalBucket ? '#f59e0b' : '#10b981'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">
              {result.topUpArsenalMedianSummary}
            </p>
            <p className="text-sm font-medium text-green-900">
              {result.topUpArsenalCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
