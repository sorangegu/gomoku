#!/bin/bash
# 五子棋部署脚本

set -e

# 配置
REMOTE_HOST="root@gobang.667728.xyz"
REMOTE_PATH="/opt/gomoku"
REPO_URL="https://github.com/sorangegu/gomoku.git"

echo "🚀 开始部署..."

# 1. 提交本地更改
echo "📦 提交本地更改..."
git add .
git status --short
git commit -m "chore: 自动部署 $(date '+%Y-%m-%d %H:%M:%S')" || echo "没有需要提交的更改"
git push origin main

# 2. 连接服务器拉取代码
echo "🌐 连接服务器拉取代码..."
ssh $REMOTE_HOST << 'ENDSSH'
cd /opt/gomoku

# 如果是第一次克隆
if [ ! -d ".git" ]; then
    echo "首次部署，克隆仓库..."
    cd /opt
    rm -rf gomoku
    git clone https://github.com/sorangegu/gomoku.git
    cd gomoku
else
    echo "拉取最新代码..."
    git fetch origin
    git reset --hard origin/main
fi

# 3. 重启服务
echo "🔄 重启服务..."
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d

# 等待服务启动
sleep 5

# 检查服务状态
echo "✅ 服务状态:"
docker ps | grep gomoku

echo "🎉 部署完成！"
ENDSSH
