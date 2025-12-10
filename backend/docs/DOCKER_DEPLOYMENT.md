# Docker 部署文档

## 🚀 快速部署

### 1. 准备环境变量
```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑 .env.production,填写真实的 API Key 和 JWT 密钥
vim .env.production
```

### 2. 构建并启动
```bash
# 使用 docker-compose 启动
docker-compose --env-file .env.production up -d

# 查看日志
docker-compose logs -f backend
```

### 3. 验证部署
```bash
# 健康检查
curl http://localhost:3000/health

# 预期响应
{
  "status": "ok",
  "database": "connected",
  "stats": {
    "users": 0,
    "words": 0,
    "oxfordWords": 3804
  }
}
```

---

## 📦 VPS 部署步骤

### 1. 上传代码到 VPS
```bash
# 方式 A: 使用 Git
ssh user@your-vps
git clone https://github.com/your-repo/english.git
cd english/backend

# 方式 B: 使用 rsync
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  ./backend user@your-vps:/path/to/app
```

### 2. 配置环境变量
```bash
# 在 VPS 上创建 .env.production
cat > .env.production << EOF
JWT_SECRET=$(openssl rand -hex 32)
DEEPSEEK_API_KEY=your-api-key-here
DEEPSEEK_API_URL=https://ark.cn-beijing.volces.com/api/v3
DEEPSEEK_MODEL=deepseek-v3-250324
EOF
```

### 3. 启动服务
```bash
# 启动
docker-compose --env-file .env.production up -d

# 查看状态
docker-compose ps
```

---

## 🔄 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose --env-file .env.production up -d --build

# 查看日志
docker-compose logs -f backend
```

---

## 🛡️ Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 启用 HTTPS (Let's Encrypt)
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 监控和维护

### 查看日志
```bash
# 实时日志
docker-compose logs -f backend

# 最近 100 行
docker-compose logs --tail=100 backend
```

### 备份数据库
```bash
# 备份
docker-compose exec backend sh -c "cp /app/data/prod.db /app/data/backup-$(date +%Y%m%d).db"

# 复制到本地
docker cp $(docker-compose ps -q backend):/app/data/backup-*.db ./
```

### 重启服务
```bash
docker-compose restart backend
```

---

## 🔧 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker-compose logs backend

# 检查配置
docker-compose config
```

### 数据库迁移失败
```bash
# 进入容器
docker-compose exec backend sh

# 手动运行迁移
npx prisma migrate deploy
```

### 端口被占用
```bash
# 修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 改为 3001
```

---

## 🎯 性能优化

### 1. 限制资源使用
在 `docker-compose.yml` 中添加:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

### 2. 启用日志轮转
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```
