#!/bin/bash

# 确保数据目录存在并设置正确权限
mkdir -p data/uploads data/downloads
chmod -R 777 data/

# 清理旧的容器和镜像
docker-compose down --remove-orphans 2>/dev/null || true
docker rmi utils-web-services 2>/dev/null || true

# 重新构建并启动
docker-compose build --no-cache
docker-compose up -d

echo "服务已启动，访问地址：http://localhost:3000"
echo "查看日志：docker-compose logs -f"
