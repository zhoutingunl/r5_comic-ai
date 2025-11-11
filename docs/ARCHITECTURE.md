# 小说转漫画生成器 - 架构设计文档


## 系统概览
**类型**: 纯前端单页应用（SPA）  
**目标**: 将用户输入的小说文本解析为漫画分镜，并生成对应的图像  
**主要特性**:
- 小说文本解析为场景、角色、对白等结构化信息
- 漫画面板/页面的 AI 图像生成
- 角色三视图生成与角色库管理
- IndexedDB 持久化角色数据，无后端依赖


## 核心模块规格

### 1. UI 组件层 (`src/components/`)
- **`comic-generation-options.tsx`**: 配置面板，选择生成模式、风格、并发等参数。
- **`comic-panel-grid.tsx`**: 展示生成出的漫画面板或页面，支持状态指示与操作按钮。
- **`character-sidebar.tsx`**: 角色库侧边栏，连接 IndexedDB 数据，支持角色创建、查看、批量生成。
- **`character-create-dialog.tsx`**: 用于创建角色或生成三视图的对话框。
- **`scene-edit-dialog.tsx`**: 场景编辑器，可调整解析出的场景信息后重新生成。
- **`api-key-settings.tsx`**: 配置 DashScope API Key，读写 localStorage。
- **UI 框架**: 基于 `shadcn/ui` 组件（封装在 `components/ui/`），配合 Tailwind CSS 实现一致的界面风格。

### 2. 页面与状态管理 (`src/App.tsx`)
- 承载主界面布局，协调各组件的状态与交互。
- 维护小说文本、场景、面板、页面等核心状态。
- 管理模式切换（单分镜/多分镜）、用户反馈（加载、错误提示）等逻辑。

### 3. AI 服务层 (`src/lib/ai-services.ts`)
- **API Key 管理**: 提供读取、设置、清空 localStorage 的工具函数。
- **模型客户端**: 使用 `@ai-sdk/openai-compatible` 创建 DashScope 兼容客户端 `createDashScopeClient`。
- **文本分析**: `analyzeNovel`、`analyzeNovelForPages` 调用 Qwen-Plus 模型解析小说文本。
- **图像生成**: `generateComic`（单面板）、`generateComicPage`（整页）调用 DashScope 图像模型。
- **输入/输出 Schema**: 借助 `zod` 校验模型返回的 JSON 结构，保证数据可靠性。

### 4. 持久化层 (`src/lib/db.ts`)
- 使用 IndexedDB (`idb` 包) 存储角色信息。
- 提供增删改查 API：`addCharacter`、`getAllCharacters`、`updateCharacter` 等。
- 数据模型与 `types/` 中定义的 `Character` 类型保持一致。


### 5. 通用工具 (`src/lib/utils.ts` 等)
- 包含 prompt 生成、错误处理、格式化函数等辅助逻辑（需根据实际文件确认）。

### 6. 类型定义 (`src/types/index.ts`)
- 集中定义 `Scene`、`ComicPanel`、`ComicPage`、`Character` 等核心类型。
- 提供常量 `COMIC_STYLES`，供 UI 显示与逻辑判断使用。
- 充当不同模块之间的契约层。

## 关键数据流

1. **文本 → 场景解析**
   - `App.tsx` 调用 `analyzeNovel`，传入小说文本和 API Key。
   - `ai-services.ts` 使用 DashScope 文本模型返回结构化场景数据。
   - 结果通过 `setScenes`/`setPages` 更新 UI。

2. **场景 → 角色同步**
   - 解析后从场景中提取角色名单。
   - 侧边栏检查 IndexedDB 是否已有对应角色。
   - 对缺失角色提供创建/自动生成入口。

3. **场景 → 图像生成**
   - 用户触发生成操作后，创建 `QueueTask` 入队。
   - 队列执行回调调用 `generateComic` 或 `generateComicPage`。
   - 生成后更新面板/页面状态，显示图像或错误信息。

4. **角色管理**
   - 创建角色对话框调用 `addCharacter` 写入 IndexedDB。
   - 侧边栏加载时调用 `getAllCharacters` 同步显示。
   - 角色信息用于构建 Prompt，提高图像一致性。

## 技术选型与约束
- **框架**: React 19 + Vite 6，偏向函数式组件与 Hooks。
- **语言**: TypeScript，所有核心模块均具备类型保护。
- **样式**: Tailwind CSS，统一的设计系统。
- **AI SDK**: Vercel AI SDK (`ai` 包) 与 DashScope 兼容客户端。
- **本地存储**: IndexedDB（角色库） + localStorage（API Key）。
- **构建工具**: Vite，`pnpm` 管理依赖。
- **部署**: 纯静态站点，可部署到 Vercel、Netlify 等。



