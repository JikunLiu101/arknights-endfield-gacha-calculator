/// <reference lib="webworker" />

import type { WorkerRunRequest, WorkerResponse } from './types';
import { runSimulation } from './engine';

self.onmessage = (ev: MessageEvent<WorkerRunRequest>) => {
  const msg = ev.data;

  if (msg.type !== 'run') return;

  try {
    const output = runSimulation(msg.input, (done, total) => {
      const progress: WorkerResponse = { type: 'progress', done, total };
      self.postMessage(progress);
    });

    const res: WorkerResponse = { type: 'result', output };
    self.postMessage(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const err: WorkerResponse = { type: 'error', message };
    self.postMessage(err);
  }
};
