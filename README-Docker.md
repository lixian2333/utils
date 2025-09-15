# Docker 部署指南

本项目支持Docker容器化部署，提供了完整的Docker配置文件。

## 📁 文件说明

- `Dockerfile` - Docker镜像构建文件
- `docker-compose.yml` - 生产环境Docker Compose配置
- `docker-compose.dev.yml` - 开发环境Docker Compose配置
- `nginx.conf` - Nginx反向代理配置
- `.dockerignore` - Docker构建忽略文件

## 🚀 快速开始

### 1. 构建并启动服务

```bash
# 生产环境
docker-compose up -d

# 开发环境（支持热重载）
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 访问服务

- **直接访问**: http://localhost:3000
- **通过Nginx**: http://localhost:80

### 3. 停止服务

```bash
# 停止并删除容器
docker-compose down

# 停止并删除容器及数据卷
docker-compose down -v
```

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 运行环境 |
| PORT | 3000 | 服务端口 |

### 端口映射

| 容器端口 | 主机端口 | 服务 |
|----------|----------|------|
| 3000 | 3000 | 应用服务 |
| 80 | 80 | Nginx HTTP |
| 443 | 443 | Nginx HTTPS |

### 数据持久化

- `./data/uploads` - 上传文件存储
- `./data/downloads` - 下载文件存储

## 🛠 开发模式

开发模式支持代码热重载，修改代码后自动重启服务：

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

## 📊 监控和日志

### 查看服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f utils-web-services
docker-compose logs -f nginx
```

### 健康检查

- 应用健康检查: http://localhost:3000
- Nginx健康检查: http://localhost/health

## 🔒 安全配置

### 生产环境建议

1. **启用HTTPS**:
   - 将SSL证书放置在 `./ssl/` 目录
   - 取消注释 `nginx.conf` 中的HTTPS配置

2. **修改默认端口**:
   ```yaml
   ports:
     - "8080:80"  # 使用非标准端口
   ```

3. **设置防火墙规则**:
   ```bash
   # 只允许必要端口
   ufw allow 80
   ufw allow 443
   ufw deny 3000  # 禁止直接访问应用端口
   ```

## 🐛 故障排除

### 常见问题

1. **端口冲突**:
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 修改端口映射
   ports:
     - "3001:3000"
   ```

2. **权限问题**:
   ```bash
   # 修复数据目录权限
   sudo chown -R 1000:1000 ./data
   ```

3. **内存不足**:
   ```bash
   # 限制容器内存使用
   deploy:
     resources:
       limits:
         memory: 512M
   ```

### 日志分析

```bash
# 查看详细日志
docker-compose logs --tail=100 -f

# 查看特定时间日志
docker-compose logs --since="2025-01-27T10:00:00" -f
```

## 📈 性能优化

### 生产环境优化

1. **多阶段构建** (已在Dockerfile中实现)
2. **Nginx缓存** (已配置静态文件缓存)
3. **Gzip压缩** (已启用)
4. **健康检查** (已配置)

### 资源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## 🔄 更新部署

```bash
# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d --force-recreate

# 清理旧镜像
docker image prune -f
```

## 📝 注意事项

1. 确保Docker和Docker Compose已正确安装
2. 生产环境建议使用Docker Swarm或Kubernetes
3. 定期备份数据目录
4. 监控容器资源使用情况
5. 及时更新基础镜像以获取安全补丁
