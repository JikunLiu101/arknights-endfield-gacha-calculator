import { Card } from '../ui/Card';
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
      <Card title="资源统计" colorScheme="blue">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              角色抽数获取总计
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.totalPulls.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              平均获取武库配额
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgArsenalGained.toLocaleString()}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              平均花费角色抽数
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgPullsSpent.toFixed(0)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-600 mb-1">
              平均花费武库配额
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {result.avgArsenalSpent.toFixed(0)}
              <span className="text-sm text-gray-500 ml-1">
                ({result.avgArsenalClaims.toFixed(1)}申领)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 角色与专武统计 */}
      <Card title="角色与专武统计" colorScheme="purple">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                期望获得限定角色
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.avgCharactersObtained.toFixed(2)} / {result.totalCharacters}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                期望获得专武
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.avgWeaponsObtained.toFixed(2)} / {result.totalWeapons}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                角色获取中位数
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.medianCharactersObtained}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">
                专武获取中位数
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {result.medianWeaponsObtained}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 角色获取分布 */}
      <Card title="限定角色获取分布" colorScheme="amber">
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

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-900">
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
              />
              <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]}>
                {result.weaponDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === result.medianWeaponsObtained ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">
              {result.weaponCumulativeSummary}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
