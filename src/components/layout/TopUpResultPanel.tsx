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

  // 将充值抽数分布按5抽一组进行合并
  const groupedTopUpPullsDistribution = result.topUpPullsDistribution.reduce((acc, entry) => {
    const groupStart = Math.floor(entry.count / 5) * 5;
    const groupEnd = groupStart + 4;
    const groupKey = `${groupStart}-${groupEnd}`;
    
    const existingGroup = acc.find(g => g.range === groupKey);
    if (existingGroup) {
      existingGroup.percentage += entry.percentage;
    } else {
      acc.push({
        range: groupKey,
        rangeStart: groupStart,
        rangeEnd: groupEnd,
        percentage: entry.percentage,
      });
    }
    return acc;
  }, [] as Array<{ range: string; rangeStart: number; rangeEnd: number; percentage: number }>);

  const medianTopUpPullsGroup = Math.floor(result.medianTopUpPulls / 5) * 5;

  return (
    <div className="space-y-6">
      <Card title="资源统计（不含充值）" colorScheme="cyan" className="relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <HoverBreakdown
            lines={result.pullsNoTopUpBreakdownLines}
            title="角色抽数来源（按卡池）"
          >
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                获得角色抽数总计（不充值）
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.totalPullsNoTopUp.toLocaleString()}
              </div>
            </div>
          </HoverBreakdown>

          <HoverBreakdown
            lines={result.arsenalNoTopUpBreakdownLines}
            title="武库配额来源（按卡池）"
          >
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-300 mb-1">
                获得武库配额总计（不充值，期望）
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {result.avgArsenalGainedNoTopUp.toFixed(0)}
              </div>
            </div>
          </HoverBreakdown>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              花费角色抽数总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgPullsSpent.toFixed(1)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              花费武库配额总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgArsenalSpent.toFixed(0)}
            </div>
          </div>
        </div>
      </Card>

      <Card title="充值统计" colorScheme="green">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border border-amber-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              充值角色抽数总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgTopUpPulls.toFixed(1)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              充值武库配额总计（期望）
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.avgTopUpArsenal.toFixed(0)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border border-amber-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              充值角色抽数（中位数）
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {result.medianTopUpPulls.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-300 mb-1">
              充值武库配额（中位数）
            </div>
            <div className="text-2xl font-bold text-gray-100">
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
              data={groupedTopUpPullsDistribution}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
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
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {groupedTopUpPullsDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.rangeStart === medianTopUpPullsGroup ? '#f59e0b' : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-200">
              {result.topUpPullsMedianSummary}
            </p>
            <p className="text-sm font-medium text-amber-200">
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
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {result.topUpArsenalDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.count === medianTopUpArsenalBucket ? '#ef4444' : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-200">
              {result.topUpArsenalMedianSummary}
            </p>
            <p className="text-sm font-medium text-red-200">
              {result.topUpArsenalCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
