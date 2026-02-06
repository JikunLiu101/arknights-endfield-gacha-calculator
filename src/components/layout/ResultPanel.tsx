
import { Card } from '../ui/Card';
import type { SimOutput } from '../../sim/types';

interface ResultPanelProps {
  result: SimOutput | null;
  isRunning: boolean;
  progress: number;
}

export function ResultPanel({ result, isRunning, progress }: ResultPanelProps) {
  if (isRunning) {
    return (
      <div className="space-y-6">
        <Card title="模拟进行中">
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
        <Card title="模拟结果">
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
      {/* 核心指标卡片 */}
      <Card title="模拟结果">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 mb-2">
                成功率
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(result.successRate * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
              <div className="text-sm font-medium text-gray-600 mb-2">
                平均消耗
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {result.avgSpent.toFixed(0)}抽
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-medium text-gray-600 mb-3">
              消耗分布
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">P50 (中位数)</div>
                <div className="text-xl font-semibold text-gray-900">
                  {result.p50Spent}抽
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">P90</div>
                <div className="text-xl font-semibold text-gray-900">
                  {result.p90Spent}抽
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">P99</div>
                <div className="text-xl font-semibold text-gray-900">
                  {result.p99Spent}抽
                </div>
              </div>
            </div>
          </div>

          {result.debug?.note && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 mb-2">
                详细信息
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {result.debug.note}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
