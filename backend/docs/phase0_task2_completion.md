# Phase 0 - Task 2: Prisma 配置完成报告

## ✅ 已完成的工作

### 1. 安装依赖
- `prisma` - CLI 工具
- `@prisma/client` - 运行时客户端
- `bcrypt` - 密码加密库
- `@types/bcrypt` - TypeScript 类型定义

### 2. 数据库 Schema 设计

```prisma
User (用户表)
├── id: Int (主键)
├── email: String (唯一)
├── password: String (bcrypt 加密)
├── name: String? (可选)
└── words: Word[] (一对多关系)

Word (单词表)
├── id: Int (主键)
├── text: String
├── userId: Int (外键)
├── contexts: Context[] (一对多关系)
└── @@unique([text, userId]) // 同一用户不重复

Context (语境表)
├── id: Int (主键)
├── sentence: String (原句)
├── meaning: String (AI 释义)
├── sourceUrl: String? (可选)
└── wordId: Int (外键)
```

### 3. 关键设计决策

**为什么分三张表?**
- `User` - 用户隔离,每人独立生词本
- `Word` - 单词不重复存储
- `Context` - 同一单词可以有多个语境

**为什么用 `@@unique([text, userId])`?**
- 允许不同用户添加相同单词
- 同一用户不会重复添加相同单词

**为什么用 `onDelete: Cascade`?**
- 删除用户时,自动清理所有单词和语境
- 删除单词时,自动清理所有关联的语境

---

## 🎓 关键知识点

### 1. Prisma 迁移机制

**生成的文件:**
```
prisma/migrations/
└── 20251210093317_init/
    └── migration.sql
```

**migration.sql 内容:**
```sql
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    ...
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Word_text_userId_key" ON "Word"("text", "userId");
```

**学习点:**
- 每次 Schema 变更都会生成新的迁移文件
- 迁移文件是 SQL,可以手动查看和修改
- 迁移是版本控制的一部分,团队协作必备

---

### 2. Prisma Client 的类型安全

**自动生成的类型:**
```typescript
// node_modules/@prisma/client/index.d.ts
export type User = {
  id: number;
  email: string;
  password: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type Word = {
  id: number;
  text: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**使用示例:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ 类型完全匹配,编辑器会提示
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    password: 'hashed_password',
  }
});

// ❌ 编译时就会报错
const user = await prisma.user.create({
  data: {
    email: 123, // 类型错误!
  }
});
```

---

### 3. 关系查询

**包含关联数据:**
```typescript
// 查询用户及其所有单词
const userWithWords = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  include: {
    words: {
      include: {
        contexts: true // 嵌套包含语境
      }
    }
  }
});

// 结果:
{
  id: 1,
  email: 'test@example.com',
  words: [
    {
      id: 1,
      text: 'service',
      contexts: [
        { sentence: 'The service is down', meaning: '服务' },
        { sentence: 'Kubernetes Service', meaning: 'K8s 服务对象' }
      ]
    }
  ]
}
```

---

## 🔍 验证步骤

### 1. 查看数据库
```bash
npx prisma studio
```
- 打开浏览器 `http://localhost:5555`
- 可以看到 User, Word, Context 三张表
- 尝试手动添加数据

### 2. 查看迁移文件
```bash
cat prisma/migrations/20251210093317_init/migration.sql
```

### 3. 查看生成的类型
```bash
cat node_modules/@prisma/client/index.d.ts | grep "export type"
```

---

## 📝 认证流程设计 (后续实现)

### Web 端登录
```
1. 用户提交 email + password
2. 后端: bcrypt.compare(输入, 数据库密码)
3. 验证通过 → 生成 JWT Token
4. 返回 Token
```

### 浏览器插件
```
未登录: 划词 → 翻译 API → 显示 (不保存)
已登录: 划词 → 翻译 API → 点击保存 → AI 分析 → 存库
```

---

## ✅ 验收清单

- [ ] 运行 `npx prisma studio` 能看到三张表
- [ ] 理解为什么要分三张表
- [ ] 理解 `@@unique([text, userId])` 的作用
- [ ] 知道迁移文件在哪里 (`prisma/migrations/`)
- [ ] 理解 Prisma Client 的类型安全

**完成后请告诉我,我们将进入下一个任务: 验证 NestJS 基础服务运行。**
