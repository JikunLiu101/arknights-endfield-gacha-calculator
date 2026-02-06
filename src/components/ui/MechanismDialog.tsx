import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface MechanismDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MechanismDialog({ isOpen, onClose }: MechanismDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-gray-900"
                  >
                    卡池机制说明
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4 text-sm text-gray-700 max-h-[70vh] overflow-y-auto">
                  {/* 基础概率 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      基础概率
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>6星概率</strong>: 0.8% (其中UP角色占50%)</li>
                      <li>• <strong>5星概率</strong>: 8%</li>
                      <li>• <strong>4星概率</strong>: 91.2%</li>
                    </ul>
                  </section>

                  {/* 保底机制 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      保底机制 (Pity System)
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• 连续65次未获得6星后，每抽概率提升5%</li>
                      <li>• <strong>第80抽必定获得6星</strong>（硬保底）</li>
                      <li>• 保底计数器<strong>跨卡池继承</strong>，不会因换池而重置</li>
                    </ul>
                  </section>

                  {/* 井机制 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      井机制 (Spark System)
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• 在当前卡池前120次抽卡中未获得UP角色时</li>
                      <li>• <strong>第120抽必定获得UP角色</strong></li>
                      <li>• 井计数器<strong>每个卡池独立</strong>，更换卡池后重置为0</li>
                    </ul>
                  </section>

                  {/* 卡池赠送 */}
                  <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                      卡池赠送10抽
                    </h4>
                    <div className="ml-4 space-y-2">
                      <p className="text-amber-900">
                        <strong>每个卡池自动赠送10抽</strong>，来源：
                      </p>
                      <ul className="space-y-1">
                        <li>• 登录签到领取：5抽</li>
                        <li>• 商店兑换获得：5抽</li>
                      </ul>
                      <p className="text-amber-900 mt-2">
                        <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                        这10抽<strong>仅可用于当前卡池</strong>，不计入库存抽数
                      </p>
                    </div>
                  </section>

                  {/* 加急招募 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      加急招募 (Fast Track)
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• 在当前卡池累计抽取30次后触发</li>
                      <li>• 额外获得<strong>10连抽</strong>（必定至少1个5星或以上）</li>
                      <li>• 这10连抽<strong>不计入保底和井计数器</strong></li>
                      <li>• 每个卡池仅触发一次</li>
                    </ul>
                  </section>

                  {/* 寻访情报书 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      寻访情报书 (Intelligence Report)
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• 在当前卡池累计抽取60次后触发</li>
                      <li>• 额外获得<strong>下个卡池的免费10连抽</strong></li>
                      <li>• 这10连抽遵循下个卡池的概率和规则</li>
                      <li>• <strong>计入下个卡池的保底和井计数器</strong></li>
                      <li>• 每个卡池仅触发一次</li>
                    </ul>
                  </section>

                  {/* 武库配额 */}
                  <section>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      武库配额 (Arsenal Points)
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>• 每次抽卡获得武库配额：</li>
                      <li className="ml-4">- 6星角色: +2000点</li>
                      <li className="ml-4">- 5星角色: +200点</li>
                      <li className="ml-4">- 4星角色: +20点</li>
                      <li>• 武库配额用于申领武器池专武</li>
                    </ul>
                  </section>

                  {/* 武器池机制 */}
                  <section className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      武器池申领机制
                    </h4>
                    <div className="ml-4 space-y-2">
                      <p className="text-purple-900">
                        <strong>申领成本</strong>：每次申领消耗1980武库配额
                      </p>
                      <div className="mt-2">
                        <p className="text-purple-900 font-semibold">保底机制（4次申领）：</p>
                        <ul className="space-y-1 mt-1">
                          <li>• 前3次未获得6星武器时，<strong>第4次必得6星武器</strong></li>
                          <li>• 该6星武器有50%概率为UP专武，50%为其他6星武器</li>
                        </ul>
                      </div>
                      <div className="mt-2">
                        <p className="text-purple-900 font-semibold">井机制（8次申领）：</p>
                        <ul className="space-y-1 mt-1">
                          <li>• 前7次未获得UP专武时，<strong>第8次必得UP专武</strong></li>
                          <li>• 完全保证获得目标专武</li>
                        </ul>
                      </div>
                      <p className="text-purple-900 mt-2">
                        <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                        井/保底计数器<strong>每个武器池独立</strong>，更换池后重置
                      </p>
                    </div>
                  </section>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={onClose}
                  >
                    我知道了
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
