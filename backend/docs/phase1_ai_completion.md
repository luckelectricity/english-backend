# AI 功能权限控制更新

## ✅ 已完成的修改

### 1. AIController 权限限制
**文件:** `src/ai/ai.controller.ts`

**修改内容:**
```typescript
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)  // 添加 RolesGuard
export class AiController {
  @Post('analyze')
  @Roles(Role.VIP, Role.VVIP, Role.ADMIN)  // 限制为 VIP+
  async analyzeWord(@Body() body: { word: string; sentence: string }) {
    // ...
  }
}
```

**效果:**
- ✅ VIP, VVIP, ADMIN 可以使用 AI 分析
- ❌ USER (普通用户) 访问返回 403 Forbidden

---

## 🎯 权限矩阵更新

| 功能 | USER | VIP | VVIP | ADMIN |
|------|------|-----|------|-------|
| 谷歌翻译 | ✅ | ✅ | ✅ | ✅ |
| AI 分析 | ❌ | ✅ | ✅ | ✅ |
| 保存单词 | ✅ | ✅ | ✅ | ✅ |
| 生词本管理 | ✅ | ✅ | ✅ | ✅ |

---

## 📝 前端集成建议

### 1. 根据用户角色选择翻译方式
```typescript
// 插件端逻辑
if (user.role === 'user') {
  // 普通用户使用谷歌翻译
  const meaning = await googleTranslate(word);
} else {
  // VIP+ 使用 AI 分析
  const meaning = await fetch('/api/ai/analyze', {
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ word, sentence })
  });
}
```

### 2. 显示升级提示
```typescript
if (user.role === 'user') {
  showUpgradePrompt('升级到 VIP 即可使用 AI 智能分析!');
}
```

---

## 🔍 测试验证

### 测试普通用户访问
```bash
# 使用普通用户 Token
curl -X POST http://localhost:3000/ai/analyze \
  -H "Authorization: Bearer <user-token>" \
  -d '{"word":"test","sentence":"This is a test"}'

# 预期响应: 403 Forbidden
```

### 测试 VIP 用户访问
```bash
# 需要先创建一个 VIP 用户或手动修改数据库中的 role 字段
UPDATE User SET role = 'vip' WHERE id = 1;

# 然后测试
curl -X POST http://localhost:3000/ai/analyze \
  -H "Authorization: Bearer <vip-token>" \
  -d '{"word":"test","sentence":"This is a test"}'

# 预期响应: {"word":"test","meaning":"测试"}
```
