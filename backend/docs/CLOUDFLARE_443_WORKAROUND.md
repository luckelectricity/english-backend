# 443端口被占用的部署方案

## 🎯 场景说明

- VPN 已占用 443 端口
- 使用 Cloudflare + 二级域名
- 需要 HTTPS 访问

---

## ✅ 推荐方案:Cloudflare SSL 终止

### 架构
```
用户 → Cloudflare (HTTPS:443) → VPS (HTTP:3000) → Backend
```

**优势:**
- ✅ 不占用 VPS 的 443 端口
- ✅ 无需配置 SSL 证书
- ✅ Cloudflare 自动处理 SSL
- ✅ 配置简单

---

## 📋 部署步骤

### 1. Cloudflare DNS 配置

登录 Cloudflare Dashboard:

```
DNS 记录:
类型: A
名称: api (或您的二级域名,如 api.yourdomain.com)
内容: <VPS IP 地址>
代理状态: 已代理 (橙色云朵图标) ← 必须开启!
TTL: 自动
```

### 2. Cloudflare SSL/TLS 设置

**SSL/TLS → 概述:**
```
加密模式: Flexible
(Cloudflare 到用户: HTTPS, Cloudflare 到源站: HTTP)
```

**或者使用 Full (推荐):**
```
加密模式: Full
(需要在 VPS 上配置自签名证书,但不需要443端口)
```

### 3. 部署后端服务

**docker-compose.yml** (已简化):
```yaml
services:
  backend:
    build: .
    ports:
      - "3000:3000"  # 只需要 HTTP
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://yourdomain.com
    # ...
```

**启动服务:**
```bash
cd /opt/english/backend
docker-compose --env-file .env.production up -d
```

### 4. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Backend (仅 Cloudflare IP)
sudo ufw enable
```

### 5. 测试访问

```bash
# 测试后端
curl http://localhost:3000/health

# 测试 Cloudflare 代理
curl https://api.yourdomain.com/health
```

---

## 🔒 安全加固

### 限制只允许 Cloudflare IP 访问

创建 `cloudflare-ips.sh`:
```bash
#!/bin/bash

# 清除现有规则
sudo ufw delete allow 3000/tcp

# 获取 Cloudflare IP 列表
CF_IPS_V4=$(curl -s https://www.cloudflare.com/ips-v4)

# 添加 Cloudflare IP 白名单
for ip in $CF_IPS_V4; do
    sudo ufw allow from $ip to any port 3000 proto tcp
done

echo "✅ Cloudflare IP 白名单已更新"
```

```bash
chmod +x cloudflare-ips.sh
./cloudflare-ips.sh
```

---

## 🎨 方案对比

### 方案 1: Cloudflare SSL 终止 (推荐) ✅

```
用户 → CF (HTTPS:443) → VPS (HTTP:3000)
```

**优点:**
- 不占用 443 端口
- 配置最简单
- SSL 由 Cloudflare 管理

**缺点:**
- Cloudflare 到源站是 HTTP (可用 Full 模式解决)

---

### 方案 2: 使用非标准 HTTPS 端口

```
用户 → CF (HTTPS:443) → VPS (HTTPS:2053)
```

**docker-compose.yml:**
```yaml
services:
  nginx:
    ports:
      - "2053:443"  # 使用 2053 端口
```

**Cloudflare 支持的 HTTPS 端口:**
- 2053, 2083, 2087, 2096, 8443

**优点:**
- 端到端 HTTPS 加密

**缺点:**
- 需要配置 SSL 证书
- 配置较复杂

---

## 📝 Cloudflare 页面规则 (可选)

### 强制 HTTPS
```
URL: http://api.yourdomain.com/*
设置: 始终使用 HTTPS
```

### 缓存设置
```
URL: https://api.yourdomain.com/health
设置: 缓存级别 - 绕过
```

---

## 🔍 故障排查

### 问题 1: 502 Bad Gateway

**原因:** 后端服务未启动或端口不通

**解决:**
```bash
# 检查后端服务
docker-compose ps

# 检查端口
netstat -tlnp | grep 3000

# 查看日志
docker-compose logs backend
```

### 问题 2: 无法获取真实 IP

**原因:** 未从 Cloudflare 头部提取 IP

**解决:** 已在代码中配置
```typescript
// src/auth/auth.controller.ts
const ip = req.headers['cf-connecting-ip'] || ...
```

### 问题 3: CORS 错误

**原因:** CORS 配置不正确

**解决:**
```env
# .env.production
CORS_ORIGIN=https://yourdomain.com
```

---

## 🎯 完整部署流程

```bash
# 1. 配置 Cloudflare DNS
# 在 Cloudflare Dashboard 中添加 A 记录,开启代理

# 2. 配置 SSL 模式
# SSL/TLS → 加密模式 → Flexible

# 3. 克隆项目
cd /opt
git clone https://github.com/yourusername/english-backend.git english/backend
cd english/backend

# 4. 配置环境变量
cp .env.production.example .env.production
vim .env.production

# 5. 启动服务
docker-compose --env-file .env.production up -d

# 6. 配置防火墙 (可选)
./cloudflare-ips.sh

# 7. 测试
curl https://api.yourdomain.com/health
```

---

## 📊 监控

### 查看访问日志
```bash
docker-compose logs -f backend | grep "登录请求"
```

### 查看真实 IP
```bash
# 应该看到 Cloudflare 传递的真实 IP
docker-compose logs backend | grep "来自 IP"
```

---

## ⚠️ 注意事项

1. **Cloudflare 代理必须开启**
   - DNS 记录的代理状态必须是橙色云朵
   - 否则无法使用 Cloudflare SSL

2. **CORS 配置**
   - 确保 `CORS_ORIGIN` 设置正确
   - 生产环境不要使用 `*`

3. **防火墙规则**
   - 建议限制只允许 Cloudflare IP 访问
   - 定期更新 Cloudflare IP 列表

4. **VPN 端口冲突**
   - 确保 VPN 使用 443,后端使用 3000
   - 两者不会冲突

---

## 🔗 相关文档

- [Cloudflare SSL 模式](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)
- [Cloudflare IP 范围](https://www.cloudflare.com/ips/)
- [Docker 部署文档](DOCKER_DEPLOYMENT.md)
