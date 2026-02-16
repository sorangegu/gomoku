#!/bin/bash
# 五子棋部署脚本

set -e

# 配置
REMOTE_HOST="gobang.667728.xyz"
REMOTE_USER="root"
REMOTE_PATH="/opt/gomoku"
SSH_OPTS="-o StrictHostKeyChecking=no -o LogLevel=ERROR"

echo "🚀 开始部署..."

# 1. 提交本地更改
echo "📦 提交本地更改..."
git add .
git status --short
git commit -m "chore: 自动部署 $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || echo "没有需要提交的更改"
git push origin main

# 2. 连接服务器拉取代码并重启
echo "🌐 连接服务器..."
sshpass -p 'Song.8023' ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
cd /opt/gomoku

# 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main

# 重启服务
echo "🔄 重启服务..."
docker compose -f docker-compose.dev.yml restart gomoku-app

# 等待服务启动
sleep 3

# 检查服务状态
echo "✅ 服务状态:"
docker ps | grep gomoku

echo "🎉 部署完成！"
ENDSSH
