# RLS策略部署指南

## 概述

本目录包含了基于Prisma Schema设计的完整RLS（Row Level Security）策略，用于就职支援网站的Supabase数据库安全控制。

## 文件说明

### 1. `21-comprehensive-rls-policies.sql`
**主要RLS策略脚本**
- 包含所有表的RLS策略设置
- 基于角色的访问控制（学生、讲师、管理员）
- 辅助函数定义
- 性能优化索引

### 2. `deploy-rls-policies.sh`
**部署脚本**
- 自动化部署RLS策略到Supabase
- 环境变量检查
- 错误处理和验证

### 3. `verify-rls-policies.sql`
**验证脚本**
- 检查RLS状态
- 验证策略设置
- 统计信息报告

## 部署步骤

### 方法一：使用部署脚本（推荐）

```bash
# 1. 确保环境变量已设置
source .env

# 2. 运行部署脚本
./scripts/deploy-rls-policies.sh
```

### 方法二：手动部署

```bash
# 1. 使用psql直接连接
psql $DATABASE_URL -f scripts/21-comprehensive-rls-policies.sql

# 2. 验证部署结果
psql $DATABASE_URL -f scripts/verify-rls-policies.sql
```

### 方法三：使用Supabase CLI

```bash
# 1. 登录Supabase
supabase login

# 2. 链接项目
supabase link --project-ref YOUR_PROJECT_REF

# 3. 推送更改
supabase db push
```

## 策略设计说明

### 角色权限矩阵

| 表名 | 学生 | 讲师 | 管理员 |
|------|------|------|--------|
| users | 自己的资料 | 自己的资料 | 所有用户 |
| student_profiles | 自己的资料 | - | 所有资料 |
| instructor_profiles | - | 自己的资料 | 所有资料 |
| applications | 自己的申请 | 查看学生申请 | 所有申请 |
| companies | 查看 | 查看 | 管理 |
| schedules | 自己的日程 | 相关日程 | 所有日程 |
| interviews | 自己的面试 | 查看相关面试 | 所有面试 |
| notifications | 自己的通知 | 自己的通知 | 所有通知 |
| feedback | 自己的反馈 | 自己的反馈 | 所有反馈 |

### 关键特性

1. **基于角色的访问控制**
   - 学生：只能访问自己的数据
   - 讲师：可以查看学生数据用于指导
   - 管理员：完全访问权限

2. **数据隔离**
   - 用户只能访问自己的数据
   - 跨用户数据访问需要特殊权限

3. **性能优化**
   - 为常用查询创建索引
   - 使用辅助函数减少重复代码

4. **安全性**
   - 所有策略都要求认证用户
   - 使用`auth.uid()`确保用户身份验证

## 验证部署

### 1. 检查RLS状态
```sql
-- 运行验证脚本
\i scripts/verify-rls-policies.sql
```

### 2. 测试权限
在Supabase Dashboard的SQL编辑器中测试：

```sql
-- 测试学生权限（需要以学生身份登录）
SELECT COUNT(*) FROM applications WHERE student_id = auth.uid();

-- 测试管理员权限（需要以管理员身份登录）
SELECT COUNT(*) FROM users WHERE is_admin();
```

### 3. 应用层测试
在您的Next.js应用中测试：

```typescript
// 测试数据访问
const { data, error } = await supabase
  .from('applications')
  .select('*');

if (error) {
  console.error('权限错误:', error);
}
```

## 故障排除

### 常见问题

1. **策略不生效**
   - 检查RLS是否启用：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
   - 验证用户认证状态

2. **权限被拒绝**
   - 检查用户角色是否正确设置
   - 验证策略条件是否匹配

3. **性能问题**
   - 检查索引是否正确创建
   - 优化查询条件

### 调试命令

```sql
-- 查看所有策略
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 查看RLS状态
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 测试函数
SELECT is_admin(), is_instructor(), is_student();
```

## 维护和更新

### 添加新策略
1. 在`21-comprehensive-rls-policies.sql`中添加新策略
2. 更新验证脚本
3. 重新部署

### 修改现有策略
1. 删除旧策略：`DROP POLICY IF EXISTS "policy_name" ON table_name;`
2. 创建新策略
3. 验证更改

## 安全注意事项

1. **定期审查策略**
   - 检查策略是否符合业务需求
   - 验证权限是否正确设置

2. **监控访问日志**
   - 使用Supabase Dashboard监控数据库访问
   - 设置异常访问告警

3. **备份策略**
   - 定期备份策略配置
   - 记录策略变更历史

## 联系支持

如果遇到问题，请：
1. 检查Supabase文档
2. 查看错误日志
3. 联系开发团队

---

**注意：** 在生产环境部署前，请务必在测试环境中验证所有策略的正确性。
