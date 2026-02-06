# arknights-endfield-gacha-calculator

纯前端、零后端成本的抽卡规划模拟网页（MVP 脚手架）。

- 需求文档与 3 小时上线计划见：`docs/requirements-and-3h-plan.md`
- 说明：当前模拟引擎为占位实现，后续补充 Endfield 固定卡池机制与抽卡策略后替换即可。

## 开发

1) 安装依赖

```bash
npm install
```

2) 本地开发

```bash
npm run dev
```

## 构建与部署（静态）

```bash
npm run build
```

产物在 `dist/`，可上传到任意静态托管（GitHub Pages / 国内静态托管 / 自有静态空间）。

## 代码结构（MVP）

- `src/main.ts`：单页 UI（输入 + 运行/取消 + 输出占位）
- `src/sim/engine.ts`：模拟引擎（占位）
- `src/sim/sim.worker.ts`：Web Worker，运行模拟避免卡 UI
- `src/sim/types.ts`：输入/输出类型
