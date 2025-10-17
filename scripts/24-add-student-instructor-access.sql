-- =====================================================
-- 为学生添加查看讲师资料的权限
-- 学生需要了解讲师信息来选择合适的指导服务
-- =====================================================

-- 1. 为学生添加查看讲师资料的权限
-- =====================================================

-- 学生可以查看所有讲师的详细资料（用于选择指导服务）
CREATE POLICY "Students can view instructor profiles"
ON instructor_profiles FOR SELECT
TO authenticated
USING (is_student());

-- 2. 验证新的权限设置
-- =====================================================

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

-- 3. 更新后的完整权限矩阵
-- =====================================================

SELECT '更新后的完整权限矩阵' as info;

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
  '👁️ 查看所有讲师资料（用于选择指导服务）' as permission
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

-- 4. 业务逻辑说明
-- =====================================================

SELECT '业务逻辑说明' as section;

SELECT 
  '学生查看讲师资料的好处' as benefit_type,
  '具体说明' as description
UNION ALL
SELECT 
  '选择合适的讲师' as benefit_type,
  '根据讲师的专业背景、经验年数、教育背景等选择最适合的指导服务' as description
UNION ALL
SELECT 
  '预约指导服务' as benefit_type,
  '了解讲师的专长领域，预约相应的面试指导、日语辅导等服务' as description
UNION ALL
SELECT 
  '建立信任关系' as benefit_type,
  '通过了解讲师的自我介绍和背景，建立更好的师生关系' as description
UNION ALL
SELECT 
  '提高指导效果' as benefit_type,
  '学生可以提前了解讲师特点，提高指导的针对性和效果' as description;

-- =====================================================
-- 修复完成
-- =====================================================
SELECT '🎉 学生查看讲师权限添加完成！' as final_status;
