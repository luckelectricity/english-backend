# Nginx Proxy Manager 部署指南

## 📋 什么是 Nginx Proxy Manager (NPM)

Nginx Proxy Manager 是一个可视化的 Nginx 反向代理管理工具,提供:
- 🎨 Web UI 界面管理
- 🔒 自动 SSL 证书申请 (Let's Encrypt)
- 🌐 反向代理配置
- 📊 访问日志查看

---

## 🚀 快速部署 NPM

### 1. 创建 docker-compose.yml

在 VPS 上创建一个新目录:
```bash
mkdir -p /opt/nginx-proxy-manager
cd /opt/nginx-proxy-manager
```

创建 `docker-compose.yml`:
```yaml
version: '3.8'

services:
  npm:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - '80:80'      # HTTP
      - '443:443'    # HTTPS
      - '81:81'      # 管理界面
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    environment:
      DB_SQLITE_FILE: "/data/database.sqlite"
```

### 2. 启动 NPM
```bash
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 访问管理界面
```
http://your-vps-ip:81
```

**默认登录信息:**
- Email: `admin@example.com`
- Password: `changeme`

**首次登录后立即修改密码!**

---

## 🔧 配置反向代理

### 1. 添加代理主机

1. 登录 NPM 管理界面
2. 点击 "Proxy Hosts" → "Add Proxy Host"
3. 填写配置:

**Details 标签:**
```
Domain Names: api.yourdomain.com
Scheme: http
Forward Hostname / IP: english-backend (Docker 容器名)
Forward Port: 3000
Cache Assets: ✓
Block Common Exploits: ✓
Websockets Support: ✓
```

**SSL 标签:**
```
SSL Certificate: Request a new SSL Certificate
Force SSL: ✓
HTTP/2 Support: ✓
HSTS Enabled: ✓
Email Address for Let's Encrypt: your@email.com
I Agree to the Let's Encrypt Terms of Service: ✓
```

**Advanced 标签 (重要!):**
```nginx
# 获取真实 IP (Cloudflare)
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;

# 传递真实 IP 到后端
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

4. 点击 "Save"

---

## 🌐 与后端服务集成

### 方式 1: NPM + Backend (推荐)

**docker-compose.yml** (后端项目):
```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: english-backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      # ... 其他环境变量
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    networks:
      - npm_default  # 连接到 NPM 网络

networks:
  npm_default:
    external: true
```

**启动后端:**
```bash
cd /opt/english/backend
docker-compose --env-file .env.production up -d
```

**在 NPM 中配置:**
- Forward Hostname: `english-backend`
- Forward Port: `3000`

---

### 方式 2: 独立网络

**创建共享网络:**
```bash
docker network create app-network
```

**NPM docker-compose.yml:**
```yaml
services:
  npm:
    # ... 其他配置
    networks:
      - app-network

networks:
  app-network:
    external: true
```

**Backend docker-compose.yml:**
```yaml
services:
  backend:
    # ... 其他配置
    networks:
      - app-network

networks:
  app-network:
    external: true
```

---

## 🔒 安全配置

### 1. 修改管理端口
```yaml
services:
  npm:
    ports:
      - '8081:81'  # 改为非标准端口
```

### 2. 限制管理界面访问
在 NPM 中添加 Access List:
1. Access Lists → Add Access List
2. 添加允许的 IP 地址
3. 应用到管理界面代理

### 3. 启用防火墙
```bash
# 只允许 80, 443, 8081 端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8081/tcp  # 管理端口
ufw enable
```

---

## 📊 监控和维护

### 查看日志
```bash
cd /opt/nginx-proxy-manager
docker-compose logs -f npm
```

### 备份数据
```bash
# 备份数据库和证书
tar -czf npm-backup-$(date +%Y%m%d).tar.gz data/ letsencrypt/
```

### 更新 NPM
```bash
docker-compose pull
docker-compose up -d
```

---

## 🎯 完整部署示例

### 目录结构
```
/opt/
├── nginx-proxy-manager/
│   ├── docker-compose.yml
│   ├── data/
│   └── letsencrypt/
└── english/
    └── backend/
        ├── docker-compose.yml
        ├── .env.production
        └── ...
```

### 部署流程
```bash
# 1. 部署 NPM
cd /opt/nginx-proxy-manager
docker-compose up -d

# 2. 部署后端
cd /opt/english/backend
docker-compose --env-file .env.production up -d

# 3. 在 NPM 中配置代理
# 访问 http://vps-ip:81 配置

# 4. 测试
curl https://api.yourdomain.com/health
```

---

## ⚠️ 常见问题

### 问题 1: 无法获取 SSL 证书
**原因:** 域名未正确解析或端口 80/443 被占用

**解决:**
```bash
# 检查域名解析
nslookup api.yourdomain.com

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### 问题 2: 后端无法连接
**原因:** 容器网络不通

**解决:**
```bash
# 检查网络
docker network ls
docker network inspect npm_default

# 测试连接
docker exec -it nginx-proxy-manager ping english-backend
```

### 问题 3: 真实 IP 获取失败
**原因:** 未配置 Cloudflare IP 范围

**解决:** 在 NPM Advanced 中添加上述 Cloudflare IP 配置

---

## 🔗 相关链接

- [NPM 官方文档](https://nginxproxymanager.com/)
- [Cloudflare IP 范围](https://www.cloudflare.com/ips/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
