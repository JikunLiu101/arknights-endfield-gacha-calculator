import './style.css';
import type { SimInput, SimOutput } from './sim/types';
import { defaultSimInput } from './sim/defaults';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');
const appEl: HTMLDivElement = app;

type WorkerRequest = {
  type: 'run';
  input: SimInput;
};

type WorkerResponse =
  | { type: 'progress'; done: number; total: number }
  | { type: 'result'; output: SimOutput }
  | { type: 'error'; message: string };

let worker: Worker | null = null;
let running = false;
let latestOutput: SimOutput | null = null;
let progressText = '';
let input: SimInput = defaultSimInput();

function render() {
  appEl.innerHTML = `
    <div class="container">
      <h1>Endfield 抽卡规划模拟（MVP 脚手架）</h1>
      <div class="card" style="margin-bottom: 12px;">
        <div class="small">说明：目前为脚手架与占位模拟逻辑；后续你补充“固定卡池机制/策略”后替换模拟核心即可。</div>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="grid">
          <div class="field">
            <label>当前抽数（currentPulls）</label>
            <input id="currentPulls" type="number" min="0" step="1" value="${input.currentPulls}" />
          </div>
          <div class="field">
            <label>每版本获得抽数（pullsPerVersion）</label>
            <input id="pullsPerVersion" type="number" min="0" step="1" value="${input.pullsPerVersion}" />
          </div>
          <div class="field">
            <label>规划版本数（versionCount）</label>
            <input id="versionCount" type="number" min="1" step="1" value="${input.versionCount}" />
          </div>
          <div class="field">
            <label>每版本卡池数（bannersPerVersion）</label>
            <input id="bannersPerVersion" type="number" min="1" step="1" value="${input.bannersPerVersion}" />
          </div>
          <div class="field">
            <label>策略（strategyId）</label>
            <select id="strategyId">
              <option value="S1" ${input.strategyId === 'S1' ? 'selected' : ''}>S1：保底派（>80抽进入）</option>
              <option value="S2" ${input.strategyId === 'S2' ? 'selected' : ''}>S2：井派（>120抽进入）</option>
            </select>
          </div>
          <div class="field">
            <label>模拟次数（trials）</label>
            <input id="trials" type="number" min="100" step="100" value="${input.trials}" />
          </div>
          <div class="field">
            <label>随机种子（seed，可空）</label>
            <input id="seed" type="text" value="${input.seed ?? ''}" />
          </div>
        </div>

        <div class="row" style="margin-top: 12px;">
          <button id="runBtn" ${running ? 'disabled' : ''}>开始模拟</button>
          <button id="cancelBtn" ${running ? '' : 'disabled'}>取消</button>
          <div class="small" id="progress">${progressText}</div>
        </div>
      </div>

      <div class="card">
        <div class="row" style="justify-content: space-between;">
          <div>结果（占位）</div>
          <div class="small">本地计算，不上传数据</div>
        </div>
        <div style="margin-top: 10px;">
          ${latestOutput ? renderOutput(latestOutput) : '<div class="small">点击“开始模拟”生成结果</div>'}
        </div>
      </div>
    </div>
  `;

  bind();
}

function renderOutput(output: SimOutput) {
  return `
    <div class="kv">
      <div>达成概率（占位）</div><div>${(output.successRate * 100).toFixed(2)}%</div>
      <div>平均消耗抽数（占位）</div><div>${output.avgSpent.toFixed(1)}</div>
      <div>P50 消耗（占位）</div><div>${output.p50Spent}</div>
      <div>P90 消耗（占位）</div><div>${output.p90Spent}</div>
      <div>P99 消耗（占位）</div><div>${output.p99Spent}</div>
    </div>
    <div style="margin-top: 10px;" class="small">调试信息：</div>
    <pre class="small">${escapeHtml(JSON.stringify(output.debug, null, 2))}</pre>
  `;
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bind() {
  const getNumber = (id: string, min: number) => {
    const el = document.querySelector<HTMLInputElement>(`#${id}`);
    if (!el) throw new Error(`Missing #${id}`);
    const value = Number(el.value);
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.floor(value));
  };

  const getText = (id: string) => {
    const el = document.querySelector<HTMLInputElement>(`#${id}`);
    if (!el) throw new Error(`Missing #${id}`);
    return el.value.trim();
  };

  const getSelect = (id: string) => {
    const el = document.querySelector<HTMLSelectElement>(`#${id}`);
    if (!el) throw new Error(`Missing #${id}`);
    return el.value;
  };

  const updateInput = () => {
    input = {
      currentPulls: getNumber('currentPulls', 0),
      currentArsenal: 0, // 固定值,后续可以添加到表单
      pullsPerVersion: getNumber('pullsPerVersion', 0),
      arsenalPerVersion: 1980, // 固定值,后续可以添加到表单
      versionCount: getNumber('versionCount', 1),
      bannersPerVersion: getNumber('bannersPerVersion', 1),
      strategyId: getSelect('strategyId') as SimInput['strategyId'],
      trials: getNumber('trials', 100),
      seed: (() => {
        const s = getText('seed');
        return s.length ? s : null;
      })(),
    };
  };

  for (const id of [
    'currentPulls',
    'pullsPerVersion',
    'versionCount',
    'bannersPerVersion',
    'trials',
    'seed',
  ]) {
    document.querySelector(`#${id}`)?.addEventListener('input', () => {
      updateInput();
    });
  }

  document.querySelector('#strategyId')?.addEventListener('change', () => {
    updateInput();
  });

  document.querySelector<HTMLButtonElement>('#runBtn')?.addEventListener('click', () => {
    updateInput();
    runSimulation();
  });

  document.querySelector<HTMLButtonElement>('#cancelBtn')?.addEventListener('click', () => {
    cancelSimulation();
  });
}

function ensureWorker() {
  if (worker) return worker;

  worker = new Worker(new URL('./sim/sim.worker.ts', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
    const msg = ev.data;

    if (msg.type === 'progress') {
      progressText = `运行中：${msg.done}/${msg.total}`;
      render();
      return;
    }

    if (msg.type === 'result') {
      running = false;
      progressText = '完成';
      latestOutput = msg.output;
      render();
      return;
    }

    if (msg.type === 'error') {
      running = false;
      progressText = `错误：${msg.message}`;
      render();
      return;
    }
  };

  worker.onerror = (err) => {
    running = false;
    progressText = `Worker 错误：${err.message}`;
    render();
  };

  return worker;
}

function runSimulation() {
  if (running) return;

  running = true;
  latestOutput = null;
  progressText = '启动中...';
  render();

  const w = ensureWorker();
  const req: WorkerRequest = { type: 'run', input };
  w.postMessage(req);
}

function cancelSimulation() {
  if (!worker) return;
  worker.terminate();
  worker = null;
  running = false;
  progressText = '已取消';
  render();
}

render();
