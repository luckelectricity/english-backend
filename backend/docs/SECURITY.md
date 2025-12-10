# 环境配置说明

## 🔐 安全注意事项

### 敏感信息保护
以下文件包含敏感信息,**绝不**应该提交到版本控制:
- `.env` - 包含真实的 API Key 和密钥
- `data/dev.db` - 数据库文件

### 已配置的保护措施
1. `.gitignore` 已包含 `.env` 和 `data/` 目录
2. `.env.example` 只包含占位符,不含真实密钥

---

## 📝 环境变量配置步骤

### 1. 复制示例文件
```bash
cp .env.example .env
```

### 2. 填写真实配置
编辑 `.env` 文件,替换以下占位符:

```env
# JWT 密钥 (生成一个随机字符串)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 火山云 DeepSeek API 配置
DEEPSEEK_API_KEY=your-volcano-engine-api-key-here  # 替换为真实 API Key
DEEPSEEK_API_URL=https://ark.cn-beijing.volces.com/api/v3
DEEPSEEK_MODEL=deepseek-v3-250324

# 数据库配置
DATABASE_URL=file:./data/dev.db
```

### 3. 生成 JWT 密钥
```bash
# 使用 Node.js 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚠️ 部署注意事项

### 生产环境
- 使用环境变量管理工具 (如 Docker Secrets, K8s Secrets)
- 定期轮换 API Key 和 JWT 密钥
- 使用强密码策略

### 团队协作
- 通过安全渠道分享 `.env` 文件 (如加密的密码管理器)
- 不要在聊天工具、邮件中直接发送 API Key
- 每个开发者使用独立的开发环境 API Key

---

## 🔍 检查清单

部署前请确认:
- [ ] `.env` 文件不在版本控制中
- [ ] `.env.example` 不包含真实密钥
- [ ] 所有文档中不包含真实 API Key
- [ ] JWT_SECRET 已更换为生产环境专用密钥
