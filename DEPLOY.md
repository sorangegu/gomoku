# 五子棋游戏 - 部署指南

## 功能特性

- 🎮 **人机对战**: 支持三档AI难度（简单/中等/困难）
- 👥 **在线对战**: 创建房间，分享链接邀请好友
- 🎨 **精美UI**: 原木色棋盘，深浅主题切换（默认深色）
- 📱 **响应式设计**: 完美适配移动端和电脑端
- 🔄 **游戏功能**: 悔棋、重新开始（在线模式需双方确认）
- 💾 **状态持久化**: 刷新页面不丢失对局状态

## 快速部署 (Docker Compose)

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 部署步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd gomoku-game
```

2. **一键部署**
```bash
chmod +x deploy.sh
./deploy.sh
```

或者手动执行：
```bash
docker-compose up -d --build
```

3. **访问应用**
- 游戏主页: `http://localhost:3000`
- WebSocket 服务: `ws://localhost:3003`

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | production | 运行环境 |
| `DATABASE_URL` | file:/app/data/gomoku.db | SQLite 数据库路径 |

### 端口配置

默认端口配置如下，如需修改请编辑 `docker-compose.yml`:

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| gomoku-app | 3000 | Next.js 应用 |
| gomoku-ws | 3003 | WebSocket 服务 |

### 数据持久化

游戏数据存储在 Docker volume `gomoku-data` 中，包括：
- SQLite 数据库文件
- 在线对战房间数据

## 服务器部署

### 使用 Nginx 反向代理

推荐使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket 服务
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 生产环境优化

1. **启用 HTTPS**: 使用 Let's Encrypt 免费证书
2. **资源限制**: 在 `docker-compose.yml` 中设置资源限制
3. **日志管理**: 配置日志轮转

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新部署
git pull
docker-compose up -d --build

# 清理数据（谨慎操作）
docker-compose down -v
```

## 项目结构

```
├── src/
│   ├── app/                 # Next.js 页面
│   ├── components/          # React 组件
│   │   ├── gomoku/          # 游戏相关组件
│   │   └── ui/              # UI 组件 (shadcn/ui)
│   ├── lib/                 # 工具函数
│   └── stores/              # Zustand 状态管理
├── mini-services/
│   └── gomoku-service/      # WebSocket 服务
├── prisma/
│   └── schema.prisma        # 数据库模型
├── Dockerfile               # 主应用 Dockerfile
├── Dockerfile.ws            # WebSocket Dockerfile
└── docker-compose.yml       # Docker Compose 配置
```

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI 组件**: shadcn/ui, Lucide Icons, Framer Motion
- **状态管理**: Zustand
- **实时通信**: Socket.io
- **数据库**: SQLite (Prisma ORM)
- **运行时**: Bun

## 故障排除

### 页面无法访问
1. 检查容器是否正常运行: `docker-compose ps`
2. 检查端口是否被占用: `lsof -i :3000`

### WebSocket 连接失败
1. 确认 WebSocket 服务已启动: `docker-compose logs gomoku-ws`
2. 检查端口 3003 是否开放

### 数据库错误
1. 检查 volume 是否正常挂载
2. 重置数据库: `docker-compose exec gomoku-app bunx prisma db push --force-reset`

## License

MIT
