#!/bin/bash

# 确保数据目录存在并设置正确权限
mkdir -p data/uploads data/downloads
chown -R 1000:1000 data/
chmod -R 755 data/

# 启动Docker Compose
docker-compose up -d

echo "服务已启动，访问地址：http://localhost:3000"
