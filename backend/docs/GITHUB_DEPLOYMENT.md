# GitHub 部署指南

## 📦 准备代码发布到 GitHub

### 1. 检查 .gitignore
确保敏感文件不会被提交:
```bash
# 查看当前 .gitignore
cat .gitignore
```

**必须排除的文件:**
```gitignore
# 环境变量
.env
.env.production
.env.local

# 数据库
data/
*.db
*.db-journal

# 依赖
node_modules/

# 构建产物
dist/
build/

# 日志
logs/
*.log

# SSL 证书
nginx/ssl/
*.pem
*.key

# IDE
.vscode/
.idea/
```

### 2. 创建 README.md
```bash
cat > README.md << 'EOF'
# English Learning Backend

基于 NestJS 的英语学习后端 API

## 功能特性

- 🔐 用户认证 (JWT + RBAC)
- 📚 单词管理
- 🤖 AI 智能分析 (DeepSeek)
- 📊 牛津3000词进度追踪

## 快速开始

详见 [部署文档](docs/GITHUB_DEPLOYMENT.md)

## 技术栈

- NestJS
- Prisma + SQLite
- Docker
- Nginx Proxy Manager

## License

MIT
EOF
```

### 3. 提交到 GitHub
```bash
# 初始化 Git (如果还没有)
git init

# 添加远程仓库
git remote add origin https://github.com/yourusername/english-backend.git

# 添加文件
git add .

# 提交
git commit -m "Initial commit: Backend API with Auth, Word, AI modules"

# 推送
git push -u origin main
```

---

## 🚀 从 GitHub 部署到 VPS

### 方式 1: 直接克隆部署 (推荐)

#### 1. 在 VPS 上安装 Docker
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录使权限生效
exit
```

#### 2. 安装 Docker Compose
```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 3. 克隆项目
```bash
# 创建项目目录
sudo mkdir -p /opt/english
cd /opt/english

# 克隆代码
git clone https://github.com/yourusername/english-backend.git backend
cd backend
```

#### 4. 配置环境变量
```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量
vim .env.production
```

**填写以下内容:**
```env
# JWT 密钥 (生成一个随机字符串)
JWT_SECRET=$(openssl rand -hex 32)

# 管理员账号
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password

# DeepSeek API
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_API_URL=https://ark.cn-beijing.volces.com/api/v3
DEEPSEEK_MODEL=deepseek-v3-250324

# CORS
CORS_ORIGIN=https://yourdomain.com
```

#### 5. 启动服务
```bash
# 构建并启动
docker-compose --env-file .env.production up -d

# 查看日志
docker-compose logs -f backend
```

#### 6. 验证部署
```bash
# 健康检查
curl http://localhost:3000/health

# 应该返回:
# {"status":"ok","database":"connected",...}
```

---

### 方式 2: 使用 GitHub Actions 自动部署

#### 1. 在 GitHub 仓库中配置 Secrets

Settings → Secrets and variables → Actions → New repository secret

添加以下 Secrets:
- `VPS_HOST`: VPS IP 地址
- `VPS_USER`: SSH 用户名
- `VPS_SSH_KEY`: SSH 私钥
- `ENV_PRODUCTION`: `.env.production` 文件内容

#### 2. 创建 GitHub Actions 工作流

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /opt/english/backend
          git pull origin main
          echo "${{ secrets.ENV_PRODUCTION }}" > .env.production
          docker-compose --env-file .env.production up -d --build
          docker-compose logs --tail=50 backend
```

#### 3. 推送代码自动部署
```bash
git add .
git commit -m "Update feature"
git push origin main

# GitHub Actions 会自动部署到 VPS
```

---

## 🔄 更新部署

### 手动更新
```bash
# SSH 到 VPS
ssh user@vps-ip

# 进入项目目录
cd /opt/english/backend

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose --env-file .env.production up -d --build

# 查看日志
docker-compose logs -f backend
```

### 使用脚本更新
创建 `update.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 开始更新..."

# 拉取最新代码
git pull origin main

# 重新构建
docker-compose --env-file .env.production build

# 重启服务
docker-compose --env-file .env.production up -d

# 显示日志
docker-compose logs --tail=50 backend

echo "✅ 更新完成!"
```

```bash
chmod +x update.sh
./update.sh
```

---

## 🔧 维护命令

### 查看日志
```bash
# 实时日志
docker-compose logs -f backend

# 最近 100 行
docker-compose logs --tail=100 backend

# 保存日志到文件
docker-compose logs backend > logs.txt
```

### 重启服务
```bash
# 重启后端
docker-compose restart backend

# 完全重启
docker-compose down
docker-compose --env-file .env.production up -d
```

### 备份数据
```bash
# 备份数据库
docker-compose exec backend sh -c "cp /app/data/prod.db /app/data/backup-$(date +%Y%m%d).db"

# 下载备份
docker cp $(docker-compose ps -q backend):/app/data/backup-*.db ./
```

### 清理
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune
```

---

## 📊 监控

### 查看容器状态
```bash
docker-compose ps
```

### 查看资源使用
```bash
docker stats
```

### 进入容器
```bash
docker-compose exec backend sh
```

---

## 🎯 完整部署流程总结

```bash
# 1. VPS 准备
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. 克隆项目
cd /opt
git clone https://github.com/yourusername/english-backend.git english/backend
cd english/backend

# 3. 配置环境
cp .env.production.example .env.production
vim .env.production  # 填写真实配置

# 4. 启动服务
docker-compose --env-file .env.production up -d

# 5. 配置 NPM (如果使用)
# 访问 http://vps-ip:81 配置反向代理

# 6. 测试
curl https://api.yourdomain.com/health
```

---

## ⚠️ 安全建议

1. **SSH 密钥认证**
   ```bash
   # 禁用密码登录
   sudo vim /etc/ssh/sshd_config
   # PasswordAuthentication no
   sudo systemctl restart sshd
   ```

2. **防火墙配置**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

3. **定期更新**
   ```bash
   # 系统更新
   sudo apt update && sudo apt upgrade -y
   
   # Docker 镜像更新
   docker-compose pull
   docker-compose up -d
   ```

4. **备份策略**
   - 每日自动备份数据库
   - 定期备份到远程存储
   - 测试备份恢复流程

---

## 🔗 相关文档

- [Docker 部署文档](DOCKER_DEPLOYMENT.md)
- [Nginx Proxy Manager 指南](NGINX_PROXY_MANAGER.md)
- [Cloudflare 配置](CLOUDFLARE_NGINX_SETUP.md)
- [管理员安全](ADMIN_SECURITY.md)
