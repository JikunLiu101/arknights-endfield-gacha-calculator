# 明日方舟：终末地 抽卡规划模拟器

> Arknights: Endfield Gacha Calculator

纯前端、零后端成本的抽卡规划模拟工具。通过 Monte Carlo 模拟，帮助玩家在有限资源下规划抽卡策略，评估获取目标角色和专武的概率。

## ✨ 核心特性

- 🎯 **精确模拟** - 基于游戏真实机制（保底、井、加急招募、情报书等）
- 📊 **可视化分析** - 直观的图表展示角色和专武获取概率分布
- 🎛️ **策略系统** - 支持多种抽卡策略（80抽小保底策略、120抽井策略）和附加策略（A1-A4）
- 🚀 **高性能** - Web Worker 异步计算，支持 10,000+ 次模拟不卡顿
- 💰 **零成本部署** - 纯静态站点，无需服务器和数据库
- 🌐 **离线可用** - 所有计算在浏览器本地完成
- 📱 **响应式设计** - 支持桌面和移动端访问

## 🎮 项目范围 (Scope)

### 核心功能
1. **资源输入** - 当前抽数、武库配额、版本规划
2. **策略选择** - 基础策略（S1/S2）+ 附加策略（A1/A2/A3/A4）
3. **蒙特卡洛模拟** - 1,000 ~ 20,000 次试验
4. **结果分析** - 期望值、中位数、分位点、概率分布

### 支持的卡池机制
- ✅ 角色池：基础概率、保底系统（65-80抽）、井机制（120抽）
- ✅ 角色池：加急招募（30抽）、寻访情报书（60抽）、卡池赠送（10抽）
- ✅ 武器池：申领系统（1980配额/次）、保底（4次）、井（8次）
- ✅ 武库配额：角色抽卡获取、版本发放

### 不支持的功能
- ❌ 登录/账号系统
- ❌ 云端数据存储
- ❌ 历史记录同步
- ❌ 付费功能和广告

## 🏗️ 技术架构

### 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **构建工具** | Vite | 快速的开发服务器和构建工具 |
| **框架** | React 18 | UI 框架 |
| **语言** | TypeScript | 类型安全的 JavaScript |
| **样式** | Tailwind CSS | 实用优先的 CSS 框架 |
| **组件库** | Headless UI | 无样式的可访问组件 |
| **图标** | Heroicons | 精美的 SVG 图标 |
| **图表** | Recharts | React 图表库 |
| **并发** | Web Worker | 后台线程执行模拟 |
| **随机数** | xorshift128+ | 可复现的伪随机数生成器 |

### 项目结构

```
arknights-endfield-gacha-calculator/
├── docs/                           # 文档目录
│   ├── gacha-mechanism.md          # 抽卡机制规则
│   ├── gacha-strategies.md         # 抽卡策略设计
│   ├── requirements.md             # 产品需求规范
│   └── ui-design-specification.md  # UI 设计规范
│
├── src/
│   ├── components/                 # React 组件
│   │   ├── ui/                     # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── RangeSlider.tsx
│   │   │   └── Select.tsx
│   │   ├── forms/                  # 表单组件
│   │   │   ├── ResourceInputs.tsx
│   │   │   ├── PlanningInputs.tsx
│   │   │   ├── StrategySelector.tsx
│   │   │   └── SimulationSettings.tsx
│   │   └── layout/                 # 布局组件
│   │       ├── Header.tsx
│   │       ├── InputPanel.tsx
│   │       └── ResultPanel.tsx
│   │
│   ├── sim/                        # 模拟引擎
│   │   ├── types.ts                # 类型定义
│   │   ├── defaults.ts             # 默认配置
│   │   ├── rng.ts                  # 随机数生成器
│   │   ├── gacha-core.ts           # 角色池核心逻辑
│   │   ├── weapon-gacha-core.ts    # 武器池核心逻辑
│   │   ├── strategies.ts           # 策略执行引擎
│   │   ├── engine.ts               # 主模拟引擎
│   │   └── sim.worker.ts           # Web Worker 入口
│   │
│   ├── hooks/                      # React Hooks
│   │   └── useSimulatorState.ts    # 状态管理
│   │
│   ├── types/                      # 全局类型定义
│   │   └── ui.ts
│   │
│   ├── App.tsx                     # 主应用组件
│   ├── main.ts                     # 应用入口（测试）
│   ├── main.tsx                    # 应用入口（Web）
│   └── style.css                   # 全局样式
│
├── public/                         # 静态资源
├── index.html                      # HTML 模板
├── package.json                    # 项目配置
├── tsconfig.json                   # TypeScript 配置
├── tailwind.config.js              # Tailwind 配置
└── vite.config.ts                  # Vite 配置
```

### 模块架构

```
┌─────────────────────────────────────────────────┐
│                   用户界面层                      │
│  (React Components + Tailwind CSS)              │
│                                                 │
│  ┌─────────────┐  ┌──────────────┐            │
│  │ InputPanel  │  │ ResultPanel  │            │
│  │ - 资源输入   │  │ - 指标卡片    │            │
│  │ - 规划配置   │  │ - 分布图表    │            │
│  │ - 策略选择   │  │ - 统计摘要    │            │
│  └─────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                    ↓         ↑
              (SimInput)  (SimOutput)
                    ↓         ↑
┌─────────────────────────────────────────────────┐
│                 Web Worker 层                    │
│  (sim.worker.ts)                                │
│                                                 │
│  - 异步执行模拟                                   │
│  - 进度上报                                      │
│  - 避免阻塞 UI                                   │
└─────────────────────────────────────────────────┘
                    ↓         ↑
┌─────────────────────────────────────────────────┐
│                 模拟引擎层                        │
│  (engine.ts)                                    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Monte Carlo 循环 (N 次试验)            │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │  策略执行器 (strategies.ts)      │   │   │
│  │  │  - 版本循环                      │   │   │
│  │  │  - 卡池循环                      │   │   │
│  │  │  - 资源管理                      │   │   │
│  │  │  - 决策逻辑                      │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓         ↑
┌─────────────────────────────────────────────────┐
│                  卡池核心层                       │
│  (gacha-core.ts + weapon-gacha-core.ts)        │
│                                                 │
│  - 单次抽卡模拟                                   │
│  - 保底/井触发逻辑                                │
│  - 加急招募/情报书                                │
│  - 武库配额计算                                   │
│  - RNG 调用                                     │
└─────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 (或 yarn/pnpm)

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 运行测试

```bash
# 运行角色池测试
npm test -- gacha-core.test.ts

# 运行武器池测试
npm test -- weapon-gacha-core.test.ts

# 运行策略测试
npm test -- strategies.test.ts

# 运行所有测试
npm test
```

### 类型检查

```bash
npm run typecheck
```

### 代码格式化

```bash
# 检查格式
npm run lint

# 自动修复
npm run lint:fix
```

## 📦 构建与部署

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录，包含：
- `index.html` - 入口 HTML
- `assets/` - JavaScript、CSS 和其他资源

### 部署选项

#### 1. GitHub Pages

```bash
# 构建
npm run build

# 部署到 gh-pages 分支
npm run deploy
```

#### 2. 任意静态托管

将 `dist/` 目录内容上传到：
- Vercel
- Netlify
- Cloudflare Pages
- 阿里云 OSS
- 腾讯云 COS
- 自建 Nginx/Apache

#### 3. 本地预览

```bash
npm run preview
```

## 🎯 使用指南

### 基本流程

1. **输入当前资源**
   - 当前角色抽数
   - 当前武库配额

2. **配置规划参数**
   - 每版本获得抽数
   - 每版本获得武库配额
   - 规划版本数（1-8）
   - 每版本卡池数（1-3）

3. **选择抽卡策略**
   - **基础策略**：
     - S1 80抽小保底策略：>80 抽进入
     - S2 120抽井策略：>120 抽进入
   - **附加策略**：
     - A1: 永远使用情报书和卡池赠送（默认开启）
     - A2: 凑加急寻访（赚取武库配额）
     - A3: 凑情报书（为下个池准备）
     - A4: 最后版本用光所有资源

4. **设置模拟参数**
   - 模拟次数：1,000 / 5,000 / 10,000 / 20,000

5. **查看结果**
   - 角色获取期望与分布
   - 专武获取期望与分布
   - 资源消耗统计
   - 概率分析

### 策略说明

详细策略说明请参考 [docs/gacha-strategies.md](docs/gacha-strategies.md)

## 📚 文档

- [抽卡机制规则](docs/gacha-mechanism.md) - 游戏抽卡系统的详细规则
- [抽卡策略设计](docs/gacha-strategies.md) - 所有策略的设计文档
- [产品需求规范](docs/requirements.md) - 功能需求和约束
- [UI 设计规范](docs/ui-design-specification.md) - 界面设计标准

## 🔧 开发说明

### 添加新策略

1. 在 `src/sim/types.ts` 中添加策略 ID 类型
2. 在 `src/sim/strategies.ts` 中实现策略逻辑
3. 在 `src/components/forms/StrategySelector.tsx` 中添加 UI 选项
4. 编写测试用例

### 修改卡池机制

1. 更新 `src/sim/gacha-core.ts` 或 `weapon-gacha-core.ts`
2. 更新相关类型定义
3. 更新测试用例
4. 更新文档 `docs/gacha-mechanism.md`

### 调试模拟结果

在浏览器控制台查看 `SimOutput.debug` 字段：

```javascript
{
  debug: {
    note: "真实模拟结果 | 策略: S1 | 角色期望: 4.93/6 | ...",
    inputEcho: { /* 完整的输入参数 */ }
  }
}
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交代码前

1. 确保代码通过类型检查：`npm run typecheck`
2. 确保测试通过：`npm test`
3. 确保代码符合格式规范：`npm run lint`
4. 更新相关文档

### Commit 规范

使用语义化提交信息：

- `feat: 新功能`
- `fix: 修复 Bug`
- `docs: 文档更新`
- `style: 代码格式（不影响功能）`
- `refactor: 重构（不改变功能）`
- `test: 测试相关`
- `chore: 构建/工具相关`

## 📄 许可证

MIT License

---

**开发者**: Claude + User
**更新日期**: 2026-02-07
**版本**: 1.0.0
