# 🎮 五子棋在线对战

一个现代化的五子棋游戏，支持人机对战和在线双人对战。

## ✨ 功能特性

- **🎯 人机对战** - 与 AI 对弈，支持 3 个难度等级
- **👥 在线对战** - 创建房间邀请好友对战
- **🎨 精美界面** - 现代化 UI 设计，支持明暗主题
- **📱 响应式布局** - 完美适配各种设备

## 🛠 技术栈

### 前端
- **Next.js 16** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **shadcn/ui** - UI 组件库
- **Framer Motion** - 动画效果
- **Zustand** - 状态管理
- **Socket.io** - 实时通信

### 后端
- **Bun** - JavaScript 运行时
- **Socket.io** - WebSocket 服务
- **Prisma** - 数据库 ORM

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
bun install

# 生成 Prisma 客户端
bun run db:generate

# 启动开发服务器
bun run dev
```

### Docker 部署

```bash
# 使用开发配置（代码挂载，无需重新构建镜像）
docker compose -f docker-compose.dev.yml up -d

# 使用生产配置（构建镜像）
docker compose up -d --build
```

## 📁 项目结构

```
├── src/
│   ├── app/              # Next.js 页面
│   ├── components/       # React 组件
│   │   ├── ui/          # shadcn/ui 组件
│   │   └── gomoku/      # 五子棋游戏组件
│   ├── hooks/           # 自定义 Hooks
│   ├── lib/             # 工具函数
│   └── stores/          # Zustand 状态管理
├── mini-services/
│   └── gomoku-service/  # WebSocket 服务
├── prisma/              # 数据库 Schema
└── public/              # 静态资源
```

## 🎯 游戏规则

1. 黑棋先行，双方轮流落子
2. 先在横、竖、斜任意方向连成五子者获胜
3. 在线模式下双方都需要点击"准备就绪"后才能开始

## 📝 更新日志

### v0.2.0
- 新增在线双人对战功能
- 优化 AI 算法
- 改进用户界面

## 📄 许可证

MIT License
