/// <reference lib="webworker" />

import type { WorkerRunRequest, WorkerResponse } from './types';
import { runSimulation, runTopUpSimulation } from './engine';

self.onmessage = (ev: MessageEvent<WorkerRunRequest>) => {
  const msg = ev.data;

  try {
    if (msg.type === 'run') {
      const output = runSimulation(msg.input, (done, total) => {
        const progress: WorkerResponse = { type: 'progress', done, total };
        self.postMessage(progress);
      });

      const res: WorkerResponse = { type: 'result', output };
      self.postMessage(res);
      return;
    }

    if (msg.type === 'runTopUp') {
      const output = runTopUpSimulation(msg.input, (done, total) => {
        const progress: WorkerResponse = { type: 'progress', done, total };
        self.postMessage(progress);
      });

      const res: WorkerResponse = { type: 'resultTopUp', output };
      self.postMessage(res);
      return;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const err: WorkerResponse = { type: 'error', message };
    self.postMessage(err);
  }
};
