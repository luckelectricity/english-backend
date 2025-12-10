# 管理员安全增强文档

## 🔐 管理员账号配置

### 环境变量配置
管理员账号通过环境变量配置,不存储在数据库中:

```env
# .env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-super-secure-password-here
```

**安全建议:**
- 使用强密码 (至少16位,包含大小写字母、数字、特殊字符)
- 定期更换密码
- 不要在代码或文档中暴露真实密码

---

## 🛡️ 登录频率限制

### 规则
- **最大失败次数:** 5次
- **锁定时长:** 5分钟
- **计数重置:** 15分钟无活动后自动重置
- **基于:** 客户端 IP 地址

### 工作流程
1. 用户登录失败 → 记录 IP + 失败次数
2. 失败次数 < 5 → 允许继续尝试
3. 失败次数 ≥ 5 → 锁定该 IP 5分钟
4. 锁定期间访问 → 返回 429 Too Many Requests
5. 登录成功 → 重置该 IP 的失败计数

---

## 📊 错误响应

### 登录失败 (未达到限制)
```json
{
  "statusCode": 401,
  "message": "邮箱或密码错误"
}
```

### 登录失败 (已锁定)
```json
{
  "statusCode": 429,
  "message": "登录失败次数过多,请 285 秒后再试",
  "remainingTime": 285
}
```

---

## 🔍 日志记录

### 失败尝试日志
```
[RateLimitService] IP 192.168.1.100 登录失败 (1/5)
[RateLimitService] IP 192.168.1.100 登录失败 (2/5)
[RateLimitService] IP 192.168.1.100 登录失败 (3/5)
```

### 锁定日志
```
[RateLimitService] IP 192.168.1.100 登录失败次数过多,已锁定 300 秒
```

### 管理员登录日志
```
[AuthService] 管理员登录尝试: admin@example.com
[AuthService] 管理员登录成功: admin@example.com
```

---

## 🎯 管理员登录流程

### 1. 配置管理员账号
```bash
# .env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=MySecureP@ssw0rd2024!
```

### 2. 管理员登录
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MySecureP@ssw0rd2024!"
  }'
```

### 3. 响应
```json
{
  "user": {
    "id": 0,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "createdAt": "2025-12-10T13:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**注意:** 管理员的 `id` 为 `0`,用于区分普通用户

---

## 🔧 部署注意事项

### 1. 生产环境配置
```bash
# 生成强密码
openssl rand -base64 32

# .env.production
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<生成的强密码>
```

### 2. Nginx 配置 (获取真实 IP)
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 3. 信任代理 (main.ts)
```typescript
app.set('trust proxy', 1);
```

---

## 📈 监控建议

### 1. 监控失败登录
```bash
# 查看登录失败日志
docker-compose logs backend | grep "登录失败"

# 统计失败次数
docker-compose logs backend | grep "登录失败" | wc -l
```

### 2. 监控锁定事件
```bash
# 查看IP锁定
docker-compose logs backend | grep "已锁定"
```

### 3. 告警设置
- 同一IP短时间内多次失败 → 发送告警
- 管理员登录成功 → 记录审计日志
- 异常IP登录 → 发送通知

---

## ⚠️ 安全最佳实践

1. **强密码策略**
   - 至少16位字符
   - 包含大小写字母、数字、特殊字符
   - 不使用常见密码

2. **定期更换**
   - 每3个月更换管理员密码
   - 更换后重启服务

3. **访问限制**
   - 使用 VPN 访问管理后台
   - 限制管理员 IP 白名单 (可选)

4. **审计日志**
   - 定期检查管理员操作日志
   - 保留日志至少6个月

5. **双因素认证 (V2 可选)**
   - 添加 TOTP 验证
   - 使用 Google Authenticator
