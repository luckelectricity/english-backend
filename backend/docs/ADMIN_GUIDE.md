# 管理员功能文档

## 🔐 管理员账号创建

### 方式 1: 数据库直接修改 (推荐)
```bash
# 进入 Prisma Studio
npx prisma studio

# 或使用 SQL
sqlite3 data/dev.db
UPDATE User SET role = 'admin' WHERE email = 'admin@example.com';
```

### 方式 2: 注册后升级
```bash
# 1. 先注册普通账号
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123","name":"Admin"}'

# 2. 使用数据库修改角色为 admin
sqlite3 data/dev.db
UPDATE User SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 📋 管理员 API

### 1. 查询所有用户
```bash
GET /admin/users
Authorization: Bearer <admin-token>
```

**响应:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "User",
    "role": "user",
    "createdAt": "2025-12-10T12:00:00.000Z",
    "updatedAt": "2025-12-10T12:00:00.000Z",
    "_count": {
      "words": 10
    }
  }
]
```

---

### 2. 查询用户详情
```bash
GET /admin/users/:id
Authorization: Bearer <admin-token>
```

**响应:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User",
  "role": "user",
  "vipExpireAt": null,
  "vvipExpireAt": null,
  "createdAt": "2025-12-10T12:00:00.000Z",
  "updatedAt": "2025-12-10T12:00:00.000Z",
  "_count": {
    "words": 10
  }
}
```

---

### 3. 修改用户角色 ⭐
```bash
PATCH /admin/users/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "vip"
}
```

**可用角色:**
- `user` - 普通用户
- `vip` - VIP 会员
- `vvip` - VVIP 会员
- `admin` - 管理员

**响应:**
```json
{
  "message": "用户角色更新成功",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User",
    "role": "vip",
    "updatedAt": "2025-12-10T13:00:00.000Z"
  }
}
```

---

### 4. 删除用户
```bash
DELETE /admin/users/:id
Authorization: Bearer <admin-token>
```

**响应:**
```json
{
  "message": "用户删除成功",
  "userId": 1
}
```

---

### 5. 系统统计
```bash
GET /admin/stats
Authorization: Bearer <admin-token>
```

**响应:**
```json
{
  "users": {
    "total": 100,
    "byRole": {
      "user": 90,
      "vip": 8,
      "vvip": 1,
      "admin": 1
    }
  },
  "words": {
    "total": 1500,
    "avgPerUser": "15.00"
  },
  "contexts": {
    "total": 3000
  },
  "oxford": {
    "total": 3804
  }
}
```

---

## 🔒 权限控制

所有 `/admin/*` 接口都需要:
1. **JWT 认证** - 必须登录
2. **ADMIN 角色** - 只有管理员可访问

**非管理员访问返回:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## 📝 使用示例

### 完整流程: 创建管理员并管理用户

```bash
# 1. 注册管理员账号
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123","name":"Admin"}'

# 2. 升级为管理员 (使用数据库)
sqlite3 data/dev.db "UPDATE User SET role = 'admin' WHERE email = 'admin@example.com';"

# 3. 管理员登录
ADMIN_TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token')

# 4. 查看所有用户
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. 将某用户升级为 VIP
curl -X PATCH http://localhost:3000/admin/users/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"vip"}'

# 6. 查看系统统计
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ⚠️ 安全建议

1. **强密码** - 管理员账号必须使用强密码
2. **限制数量** - 只创建必要的管理员账号
3. **日志监控** - 定期检查管理员操作日志
4. **定期审计** - 定期检查用户角色分配

---

## 🔍 日志记录

所有管理员操作都会记录日志:
```
[AdminController] 管理员查询所有用户
[AdminController] 管理员修改用户角色: user@example.com -> vip
[AdminController] 管理员删除用户: ID 5
[AdminController] 管理员查询系统统计
```
