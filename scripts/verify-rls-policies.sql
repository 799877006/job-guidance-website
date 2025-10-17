-- =====================================================
-- RLS策略验证脚本
-- 用于验证RLS策略是否正确设置
-- =====================================================

-- 1. 检查所有表的RLS状态
-- =====================================================
SELECT 
  'RLS状态检查' as check_type,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ 已启用'
    ELSE '❌ 未启用'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'student_profiles', 'instructor_profiles', 
  'applications', 'companies', 'schedules', 
  'interviews', 'notifications', 'feedback'
)
ORDER BY tablename;

-- 2. 检查所有策略
-- =====================================================
SELECT 
  '策略检查' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN permissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as policy_type,
  cmd as operation,
  CASE 
    WHEN roles = '{authenticated}' THEN '认证用户'
    WHEN roles = '{}' THEN '所有用户'
    ELSE array_to_string(roles, ', ')
  END as target_roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. 检查辅助函数
-- =====================================================
SELECT 
  '函数检查' as check_type,
  proname as function_name,
  CASE 
    WHEN proname = 'is_admin' THEN '✅ 管理员检查函数'
    WHEN proname = 'is_instructor' THEN '✅ 讲师检查函数'
    WHEN proname = 'is_student' THEN '✅ 学生检查函数'
    ELSE '❓ 其他函数'
  END as function_status
FROM pg_proc 
WHERE proname IN ('is_admin', 'is_instructor', 'is_student')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. 检查索引
-- =====================================================
SELECT 
  '索引检查' as check_type,
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE 'idx_%' THEN '✅ 自定义索引'
    ELSE '📋 系统索引'
  END as index_type
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'student_profiles', 'instructor_profiles', 
  'applications', 'companies', 'schedules', 
  'interviews', 'notifications', 'feedback'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. 统计信息
-- =====================================================
SELECT 
  '统计信息' as check_type,
  '总表数' as metric,
  COUNT(*) as value
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'student_profiles', 'instructor_profiles', 
  'applications', 'companies', 'schedules', 
  'interviews', 'notifications', 'feedback'
)

UNION ALL

SELECT 
  '统计信息' as check_type,
  '总策略数' as metric,
  COUNT(*) as value
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  '统计信息' as check_type,
  '启用RLS的表数' as metric,
  COUNT(*) as value
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
AND tablename IN (
  'users', 'student_profiles', 'instructor_profiles', 
  'applications', 'companies', 'schedules', 
  'interviews', 'notifications', 'feedback'
);

-- 6. 测试查询（需要认证用户）
-- =====================================================
-- 注意：这些查询需要在有认证用户的情况下运行
-- 可以在应用代码中测试，或者使用Supabase Dashboard的SQL编辑器

/*
-- 测试学生用户权限
SELECT '学生权限测试' as test_type, COUNT(*) as accessible_records
FROM applications 
WHERE student_id = auth.uid();

-- 测试管理员权限
SELECT '管理员权限测试' as test_type, COUNT(*) as accessible_records
FROM users 
WHERE is_admin();

-- 测试讲师权限
SELECT '讲师权限测试' as test_type, COUNT(*) as accessible_records
FROM schedules 
WHERE instructor_id = auth.uid() OR type = 'MENTORING';
*/

-- =====================================================
-- 验证完成
-- =====================================================
SELECT '🎉 RLS策略验证完成！' as final_status;
