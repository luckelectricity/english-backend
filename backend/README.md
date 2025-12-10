# English Learning Backend

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

基于 NestJS 的英语学习后端 API,支持单词管理、AI 智能分析和进度追踪。

---

## ✨ 功能特性

- 🔐 **用户认证** - JWT + 角色权限控制 (USER/VIP/VVIP/ADMIN)
- 📚 **单词管理** - 智能查重、多语境保存
- 🤖 **AI 分析** - DeepSeek 集成,根据语境生成释义
- 📊 **进度追踪** - 牛津3000词学习进度
- 🛡️ **安全防护** - 登录频率限制、IP 追踪
- 📝 **完整日志** - 操作审计和错误追踪

---

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 20+ (开发环境)

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/english-backend.git
cd english-backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填写配置

# 4. 数据库迁移
npx prisma migrate dev

# 5. 导入牛津3000词
node scripts/scrape-oxford-3000.js
node scripts/import-oxford-3000.js

# 6. 启动开发服务器
npm run start:dev
```

### Docker 部署

```bash
# 1. 配置环境变量
cp .env.production.example .env.production
# 编辑 .env.production

# 2. 启动服务
docker-compose --env-file .env.production up -d

# 3. 查看日志
docker-compose logs -f backend
```

详细部署文档: [GitHub 部署指南](docs/GITHUB_DEPLOYMENT.md)

---

## 📋 API 文档

### 认证相关

- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取当前用户信息

### 单词管理

- `POST /words` - 保存单词
- `GET /words` - 获取生词本
- `DELETE /words/:id` - 删除单词
- `GET /words/oxford-progress` - 牛津词进度

### AI 功能 (VIP+)

- `POST /ai/analyze` - AI 单词分析

### 管理员 (ADMIN)

- `GET /admin/users` - 查询所有用户
- `PATCH /admin/users/role` - 修改用户角色
- `GET /admin/stats` - 系统统计

---

## 📖 文档

- [Docker 部署](docs/DOCKER_DEPLOYMENT.md)
- [GitHub 部署](docs/GITHUB_DEPLOYMENT.md)
- [Nginx Proxy Manager](docs/NGINX_PROXY_MANAGER.md)
- [Cloudflare 配置](docs/CLOUDFLARE_NGINX_SETUP.md)
- [管理员指南](docs/ADMIN_GUIDE.md)
- [安全配置](docs/ADMIN_SECURITY.md)
- [日志系统](docs/LOGGING.md)

---

## 📄 License

MIT License
