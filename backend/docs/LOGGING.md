# 日志系统文档

## 📝 日志级别

NestJS 使用以下日志级别:
- `log` - 一般信息 (绿色)
- `error` - 错误信息 (红色)
- `warn` - 警告信息 (黄色)
- `debug` - 调试信息 (蓝色)
- `verbose` - 详细信息 (青色)

---

## 🎯 已添加的日志

### 1. HTTP 请求日志
**位置:** `src/common/interceptors/logging.interceptor.ts`

**记录内容:**
- 请求方法和路径
- 响应状态码
- 请求耗时
- 客户端 IP
- User-Agent

**示例输出:**
```
[HTTP] POST /auth/login 200 45ms - ::1 Mozilla/5.0...
[HTTP] GET /words 200 12ms - ::1 Mozilla/5.0...
[HTTP] POST /ai/analyze 403 5ms - ::1 Mozilla/5.0...
```

---

### 2. 认证日志
**位置:** `src/auth/auth.service.ts`

**记录内容:**
- 用户注册请求
- 注册成功/失败
- 登录请求
- 登录成功/失败 (包含角色信息)

**示例输出:**
```
[AuthService] 注册请求: test@example.com
[AuthService] 用户注册成功: test@example.com (ID: 1)
[AuthService] 登录请求: test@example.com
[AuthService] 用户登录成功: test@example.com (ID: 1, Role: user)
[AuthService] 登录失败: 密码错误 - test@example.com
```

---

### 3. 单词管理日志
**位置:** `src/word/word.service.ts`

**记录内容:**
- 保存单词请求
- 单词查重结果
- 创建新单词/添加语境
- 删除单词操作

**示例输出:**
```
[WordService] 保存单词: service (用户ID: 1)
[WordService] 单词已存在,添加新语境: service
[WordService] 创建新单词: context
[WordService] 删除单词: service (用户ID: 1)
[WordService] 删除单词失败: 无权限 (用户ID: 2, 单词ID: 1)
```

---

### 4. AI 服务日志
**位置:** `src/ai/ai.service.ts`

**记录内容:**
- AI 分析请求
- AI 分析成功/失败

**示例输出:**
```
[AiService] AI 分析成功: service -> 服务
[AiService] AI 分析失败: API rate limit exceeded
```

---

### 5. 应用启动日志
**位置:** `src/main.ts`

**记录内容:**
- 应用启动信息
- 监听端口
- API 地址

**示例输出:**
```
[Bootstrap] 🚀 应用启动成功,端口: 3000
[Bootstrap] 📝 API 文档: http://localhost:3000
[Bootstrap] 🔍 健康检查: http://localhost:3000/health
```

---

## 🔍 查看日志

### 开发环境
```bash
# 实时查看
npm run start:dev
```

### Docker 环境
```bash
# 实时日志
docker-compose logs -f backend

# 最近 100 行
docker-compose logs --tail=100 backend

# 保存到文件
docker-compose logs backend > logs.txt
```

---

## 📊 生产环境日志管理

### 1. 日志轮转
在 `docker-compose.yml` 中已配置:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. 日志聚合 (可选)
使用 ELK Stack 或 Loki:
```yaml
services:
  backend:
    logging:
      driver: "loki"
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
```

### 3. 日志级别控制
通过环境变量控制:
```bash
# .env.production
LOG_LEVEL=log  # log, error, warn, debug, verbose
```

---

## 🐛 调试技巧

### 1. 启用详细日志
```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

### 2. 过滤特定模块
```bash
# 只看 AuthService 的日志
docker-compose logs backend | grep AuthService
```

### 3. 监控错误
```bash
# 只看错误日志
docker-compose logs backend | grep ERROR
```
