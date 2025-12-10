# Phase 0 - Task 3: NestJS 服务验证完成

## ✅ 已完成的工作

### 1. 创建 PrismaService
**文件:** `src/prisma/prisma.service.ts`

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ 数据库连接成功');
  }
}
```

**学习点:**
- `extends PrismaClient` - 继承所有 Prisma 方法
- `OnModuleInit` - NestJS 生命周期钩子
- `$connect()` - 建立数据库连接

---

### 2. 创建 PrismaModule
**文件:** `src/prisma/prisma.module.ts`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**学习点:**
- `@Global()` - 全局模块,其他模块无需 import
- `exports` - 导出 Service 供其他模块使用

---

### 3. 集成 ConfigModule
**文件:** `src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
  ],
  ...
})
```

**学习点:**
- `ConfigModule.forRoot()` - 加载环境变量
- `isGlobal: true` - 全局可用

---

### 4. 创建健康检查 API
**文件:** `src/app.controller.ts`

```typescript
@Get('health')
async healthCheck() {
  const userCount = await this.prisma.user.count();
  const wordCount = await this.prisma.word.count();
  const oxfordCount = await this.prisma.oxfordWord.count();
  
  return {
    status: 'ok',
    database: 'connected',
    stats: {
      users: userCount,
      words: wordCount,
      oxfordWords: oxfordCount,
    },
  };
}
```

---

## 🎓 关键知识点

### 1. 依赖注入的工作流程

```typescript
constructor(
  private readonly appService: AppService,
  private readonly prisma: PrismaService,
) {}
```

**NestJS 做了什么?**
1. 扫描 `AppController` 的构造函数
2. 发现需要 `AppService` 和 `PrismaService`
3. 从 IoC 容器中获取这两个实例
4. 注入到 `AppController` 中

**为什么用 `private readonly`?**
- `private` - 只能在类内部访问
- `readonly` - 不能被重新赋值,保证单例

---

### 2. 模块的加载顺序

```
应用启动
  ↓
AppModule 加载
  ↓
ConfigModule.forRoot() 执行 (加载 .env)
  ↓
PrismaModule 加载
  ↓
PrismaService 实例化
  ↓
PrismaService.onModuleInit() 执行 (连接数据库)
  ↓
AppController 实例化 (注入 PrismaService)
  ↓
路由注册 (/, /health)
  ↓
应用就绪 ✅
```

---

### 3. 全局模块 vs 普通模块

**普通模块:**
```typescript
@Module({
  imports: [PrismaModule], // 每个需要的模块都要 import
})
```

**全局模块:**
```typescript
@Global()
@Module({})
// 其他模块无需 import,直接注入使用
```

---

## 🔍 验证结果

### 启动日志
```
[Nest] Starting Nest application...
[Nest] PrismaModule dependencies initialized
[Nest] ConfigModule dependencies initialized
[Nest] AppModule dependencies initialized
[Nest] Mapped {/, GET} route
[Nest] Mapped {/health, GET} route
✅ 数据库连接成功
[Nest] Nest application successfully started
```

### 健康检查响应
```bash
$ curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "database": "connected",
  "stats": {
    "users": 0,
    "words": 0,
    "oxfordWords": 3804
  }
}
```

---

## 📝 Phase 0 总结

至此,Phase 0 的所有任务已完成:

✅ **Task 1:** 初始化后端项目 (NestJS + TypeScript)  
✅ **Task 2:** 配置 Prisma 和设计数据库 (User, Word, Context, OxfordWord)  
✅ **Task 3:** 验证服务运行 (Prisma 集成 + 健康检查 API)

**下一步 (Phase 1):**
- 开发 WordModule (单词管理 API)
- 开发 AIModule (DeepSeek 集成)
- 开发 AuthModule (用户认证)
