# Cloudflare + Nginx + NestJS 真实 IP 获取指南

## 🌐 架构说明

```
用户 → Cloudflare CDN → VPS Nginx → Docker Backend
```

**IP 传递链路:**
1. Cloudflare 接收用户请求,获取真实 IP
2. Cloudflare 在 `CF-Connecting-IP` 头中传递真实 IP
3. Nginx 转发所有头部到后端
4. NestJS 从头部提取真实 IP

---

## ✅ 已配置的功能

### 1. NestJS 信任代理
**文件:** `src/main.ts`
```typescript
app.set('trust proxy', true);
```

### 2. IP 提取优先级
**文件:** `src/auth/auth.controller.ts`
```typescript
const ip = 
    req.headers['cf-connecting-ip'] ||  // Cloudflare 真实 IP (最优先)
    req.headers['x-real-ip'] ||         // Nginx 传递的 IP
    req.headers['x-forwarded-for'] ||   // 代理链 IP
    req.ip ||                            // Express 解析的 IP
    'unknown';
```

### 3. Nginx 配置
**文件:** `nginx/conf.d/default.conf`
```nginx
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

---

## 🚀 部署步骤

### 1. 创建 Nginx 配置目录
```bash
mkdir -p nginx/conf.d nginx/ssl nginx/logs
```

### 2. 修改 Nginx 配置
编辑 `nginx/conf.d/default.conf`:
```nginx
server_name api.yourdomain.com;  # 改为你的域名
```

### 3. 配置环境变量
```bash
# .env.production
CORS_ORIGIN=https://yourdomain.com
```

### 4. 启动服务
```bash
docker-compose --env-file .env.production up -d
```

---

## 🔒 SSL 证书配置 (Let's Encrypt)

### 方式 1: 使用 Certbot (推荐)
```bash
# 安装 certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d api.yourdomain.com

# 复制证书到项目
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# 重启 Nginx
docker-compose restart nginx
```

### 方式 2: 使用 Cloudflare Origin Certificate
1. Cloudflare Dashboard → SSL/TLS → Origin Server
2. Create Certificate
3. 复制证书和私钥到 `nginx/ssl/`

---

## 🧪 测试真实 IP 获取

### 1. 查看日志
```bash
# 登录并查看日志中的 IP
docker-compose logs -f backend | grep "登录请求"

# 应该看到类似:
[AuthService] 登录请求: user@example.com (来自 IP: 1.2.3.4)
```

### 2. 测试登录
```bash
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# 多次失败后应该被锁定
```

### 3. 验证 Cloudflare 头部
```bash
# 在服务器上测试
curl -H "CF-Connecting-IP: 1.2.3.4" http://localhost/auth/login

# 查看日志确认 IP 是 1.2.3.4
```

---

## 📋 Cloudflare 设置

### 1. DNS 配置
```
类型: A
名称: api
内容: <VPS IP>
代理状态: 已代理 (橙色云朵)
```

### 2. SSL/TLS 设置
- 加密模式: **Full (strict)** 或 **Full**
- 最低 TLS 版本: TLS 1.2
- 自动 HTTPS 重写: 开启

### 3. 防火墙规则 (可选)
限制只允许 Cloudflare IP 访问:
```bash
# 获取 Cloudflare IP 列表
curl https://www.cloudflare.com/ips-v4

# 在 VPS 防火墙中只允许这些 IP
```

---

## 🔍 故障排查

### 问题 1: 获取到的 IP 是 Cloudflare IP
**原因:** Nginx 没有正确传递 CF-Connecting-IP 头

**解决:**
```nginx
# 确保 Nginx 配置中有:
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
```

### 问题 2: IP 显示为 127.0.0.1 或 172.x.x.x
**原因:** NestJS 没有信任代理

**解决:**
```typescript
// main.ts
app.set('trust proxy', true);
```

### 问题 3: 频率限制不生效
**原因:** 每次请求 IP 都不同

**解决:** 检查日志中的 IP 是否正确
```bash
docker-compose logs backend | grep "来自 IP"
```

---

## 📊 监控和日志

### 查看访问日志
```bash
# Nginx 访问日志
docker-compose exec nginx tail -f /var/log/nginx/access.log

# 后端日志
docker-compose logs -f backend
```

### 统计 IP 访问
```bash
# 统计访问最多的 IP
docker-compose exec nginx awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

---

## 🎯 完整部署流程

```bash
# 1. 上传代码到 VPS
rsync -avz --exclude 'node_modules' ./backend user@vps:/opt/english/

# 2. 配置环境变量
cd /opt/english/backend
cp .env.production.example .env.production
vim .env.production  # 填写真实配置

# 3. 创建 SSL 证书
sudo certbot certonly --standalone -d api.yourdomain.com
sudo cp /etc/letsencrypt/live/api.yourdomain.com/*.pem nginx/ssl/

# 4. 启动服务
docker-compose --env-file .env.production up -d

# 5. 查看日志
docker-compose logs -f

# 6. 测试
curl https://api.yourdomain.com/health
```

---

## ⚠️ 安全建议

1. **只允许 Cloudflare IP 访问**
   - 配置防火墙规则
   - 拒绝直接访问 VPS IP

2. **启用 Cloudflare WAF**
   - 防止 DDoS 攻击
   - 过滤恶意请求

3. **定期更新 SSL 证书**
   - Let's Encrypt 证书有效期 90 天
   - 配置自动续期

4. **监控异常 IP**
   - 设置告警规则
   - 记录可疑访问
