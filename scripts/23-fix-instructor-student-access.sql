-- =====================================================
-- 修复讲师访问学生资料的权限
-- 讲师需要查看学生资料来进行有效的指导
-- =====================================================

-- 1. 为讲师添加查看学生资料的权限
-- =====================================================

-- 讲师可以查看所有学生的详细资料（用于指导）
CREATE POLICY "Instructors can view student profiles"
ON student_profiles FOR SELECT
TO authenticated
USING (is_instructor());

-- 2. 为讲师添加查看讲师资料的权限（可选，用于团队协作）
-- =====================================================

-- 讲师可以查看其他讲师的资料（用于团队协作）
CREATE POLICY "Instructors can view instructor profiles"
ON instructor_profiles FOR SELECT
TO authenticated
USING (is_instructor());

-- 3. 验证新的权限设置
-- =====================================================

-- 显示student_profiles表的所有策略
SELECT 
  'Student Profiles策略' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'student_profiles'
ORDER BY policyname;

-- 显示instructor_profiles表的所有策略
SELECT 
  'Instructor Profiles策略' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'instructor_profiles'
ORDER BY policyname;

-- 4. 更新后的权限矩阵
-- =====================================================

SELECT '更新后的权限矩阵' as info;

-- Student Profiles权限
SELECT 
  'Student Profiles' as table_name,
  '学生' as role,
  '✅ 管理自己的资料' as permission
UNION ALL
SELECT 
  'Student Profiles' as table_name,
  '讲师' as role,
  '👁️ 查看所有学生资料（用于指导）' as permission
UNION ALL
SELECT 
  'Student Profiles' as table_name,
  '管理员' as role,
  '✅ 管理所有学生资料' as permission

UNION ALL

-- Instructor Profiles权限
SELECT 
  'Instructor Profiles' as table_name,
  '学生' as role,
  '❌ 无权限' as permission
UNION ALL
SELECT 
  'Instructor Profiles' as table_name,
  '讲师' as role,
  '✅ 管理自己的资料 + 👁️ 查看其他讲师资料' as permission
UNION ALL
SELECT 
  'Instructor Profiles' as table_name,
  '管理员' as role,
  '✅ 管理所有讲师资料' as permission;

-- =====================================================
-- 修复完成
-- =====================================================
SELECT '🎉 讲师访问权限修复完成！' as final_status;
