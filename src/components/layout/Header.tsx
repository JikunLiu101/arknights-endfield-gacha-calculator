import { useState } from 'react';
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react';
import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="bg-gradient-to-r from-blue-50 via-purple-50 to-purple-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              明日方舟：终末地 抽卡规划模拟器
            </h1>
            <p className="text-base text-gray-600">
              作者：Bilibili
              <a
                href="https://space.bilibili.com/91894447"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @爱积分的好青年
              </a> ，开源地址：
              <a
                href="https://github.com/JikunLiu101/arknights-endfield-gacha-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
            </p>
            <div className="mt-3">
              <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                <HeartIcon className="h-5 w-5 text-pink-500" />
                <span className="text-sm font-medium text-gray-700">打赏支持</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                感谢您的支持！
              </DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center">
              <img
                src="./buymeacoffee.jpg"
                alt="Buy Me A Coffee"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
              <p className="mt-4 text-sm text-gray-600">
                如果这个工具对您有帮助，欢迎请作者喝杯咖啡！
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
