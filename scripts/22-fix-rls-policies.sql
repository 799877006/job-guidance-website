-- =====================================================
-- 修复RLS策略中的类型不匹配问题
-- 解决 auth.uid() (uuid) 与 id (text) 的类型冲突
-- =====================================================

-- 1. 删除有问题的策略
-- =====================================================

-- Users表策略
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Student Profiles表策略
DROP POLICY IF EXISTS "Students can manage own profile" ON student_profiles;

-- Instructor Profiles表策略
DROP POLICY IF EXISTS "Instructors can manage own profile" ON instructor_profiles;

-- Applications表策略
DROP POLICY IF EXISTS "Students can manage own applications" ON applications;

-- Schedules表策略
DROP POLICY IF EXISTS "Users can manage own schedules" ON schedules;

-- Interviews表策略
DROP POLICY IF EXISTS "Students can view own interviews" ON interviews;

-- Notifications表策略
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

-- Feedback表策略
DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback;

-- 2. 创建修复后的策略（使用类型转换）
-- =====================================================

-- Users表RLS策略
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Student Profiles表RLS策略
CREATE POLICY "Students can manage own profile"
ON student_profiles FOR ALL
TO authenticated
USING (
  auth.uid()::text = "userId" 
  AND is_student()
)
WITH CHECK (
  auth.uid()::text = "userId" 
  AND is_student()
);

-- Instructor Profiles表RLS策略
CREATE POLICY "Instructors can manage own profile"
ON instructor_profiles FOR ALL
TO authenticated
USING (
  auth.uid()::text = "userId" 
  AND is_instructor()
)
WITH CHECK (
  auth.uid()::text = "userId" 
  AND is_instructor()
);

-- Applications表RLS策略
CREATE POLICY "Students can manage own applications"
ON applications FOR ALL
TO authenticated
USING (
  auth.uid()::text = student_id 
  AND is_student()
)
WITH CHECK (
  auth.uid()::text = student_id 
  AND is_student()
);

-- Schedules表RLS策略
CREATE POLICY "Users can manage own schedules"
ON schedules FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Instructors can view related schedules"
ON schedules FOR SELECT
TO authenticated
USING (
  is_instructor() 
  AND (
    instructor_id = auth.uid()::text 
    OR type = 'MENTORING'
  )
);

-- Interviews表RLS策略
CREATE POLICY "Students can view own interviews"
ON interviews FOR SELECT
TO authenticated
USING (
  is_student() 
  AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = interviews.application_id 
    AND applications.student_id = auth.uid()::text
  )
);

-- Notifications表RLS策略
CREATE POLICY "Users can manage own notifications"
ON notifications FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Feedback表RLS策略
CREATE POLICY "Users can manage own feedback"
ON feedback FOR ALL
TO authenticated
USING (
  auth.uid()::text = user_id 
  OR user_id IS NULL
)
WITH CHECK (
  auth.uid()::text = user_id 
  OR user_id IS NULL
);

-- 3. 验证修复结果
-- =====================================================

-- 显示所有策略
SELECT 
  '修复后的策略' as status,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 显示RLS状态
SELECT 
  'RLS状态' as status,
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

-- =====================================================
-- 修复完成
-- =====================================================
SELECT '🎉 RLS策略修复完成！' as final_status;
