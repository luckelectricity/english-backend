# AI 功能权限说明

## 🔐 访问控制

### 权限等级
- **USER (普通用户)** - ❌ 无 AI 分析权限,使用谷歌翻译
- **VIP** - ✅ 可使用 AI 分析
- **VVIP** - ✅ 可使用 AI 分析
- **ADMIN** - ✅ 可使用 AI 分析

---

## 📋 API 端点权限

### `/ai/analyze` - AI 单词分析
- **权限要求:** VIP 及以上
- **普通用户访问:** 返回 403 Forbidden

**示例:**
```bash
# VIP 用户 - 成功
curl -X POST http://localhost:3000/ai/analyze \
  -H "Authorization: Bearer <vip-token>" \
  -d '{"word":"service","sentence":"The service is down"}'
# 响应: {"word":"service","meaning":"服务"}

# 普通用户 - 失败
curl -X POST http://localhost:3000/ai/analyze \
  -H "Authorization: Bearer <user-token>" \
  -d '{"word":"service","sentence":"The service is down"}'
# 响应: 403 Forbidden
```

---

## 🌐 普通用户替代方案

### 谷歌翻译 API
普通用户应使用谷歌翻译进行单词翻译:

**前端实现示例:**
```typescript
async function translateWord(word: string, userRole: string) {
  if (userRole === 'user') {
    // 普通用户使用谷歌翻译
    return await googleTranslate(word);
  } else {
    // VIP+ 用户使用 AI 分析
    return await aiAnalyze(word, sentence);
  }
}
```

---

## 💡 升级提示

当普通用户尝试使用 AI 功能时,前端应显示升级提示:

```
您当前是普通用户,正在使用谷歌翻译。
升级到 VIP 会员,即可使用 AI 智能分析,
根据语境提供更精准的单词释义!

[立即升级]
```

---

## 🎯 设计理念

1. **成本控制** - AI API 调用有成本,限制普通用户访问
2. **防止滥用** - 避免恶意用户大量调用 AI 接口
3. **会员价值** - 为 VIP 会员提供差异化服务
