-- =====================================================
-- 基于Prisma Schema的完整RLS策略设置
-- 适用于就职支援网站的Supabase数据库
-- =====================================================

-- 1. 首先删除所有现有的策略（避免冲突）
-- =====================================================

-- Users表策略
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Student Profiles表策略
DROP POLICY IF EXISTS "Students can manage own profile" ON student_profiles;
DROP POLICY IF EXISTS "Admins can manage all student profiles" ON student_profiles;

-- Instructor Profiles表策略
DROP POLICY IF EXISTS "Instructors can manage own profile" ON instructor_profiles;
DROP POLICY IF EXISTS "Admins can manage all instructor profiles" ON instructor_profiles;

-- Applications表策略
DROP POLICY IF EXISTS "Students can manage own applications" ON applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;
DROP POLICY IF EXISTS "Instructors can view student applications" ON applications;

-- Companies表策略
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;

-- Schedules表策略
DROP POLICY IF EXISTS "Users can manage own schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON schedules;
DROP POLICY IF EXISTS "Instructors can view related schedules" ON schedules;

-- Interviews表策略
DROP POLICY IF EXISTS "Students can view own interviews" ON interviews;
DROP POLICY IF EXISTS "Admins can manage all interviews" ON interviews;
DROP POLICY IF EXISTS "Instructors can view related interviews" ON interviews;

-- Notifications表策略
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Feedback表策略
DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can manage all feedback" ON feedback;

-- 2. 启用RLS（如果尚未启用）
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 3. 创建辅助函数
-- =====================================================

-- 检查用户是否为管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'ADMINISTRATOR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否为讲师
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'INSTRUCTOR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否为学生
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'STUDENT'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Users表RLS策略
-- =====================================================

-- 用户可以查看自己的资料
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 用户可以插入自己的资料（注册时）
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 管理员可以管理所有用户
CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (is_admin());

-- 5. Student Profiles表RLS策略
-- =====================================================

-- 学生可以管理自己的详细资料
CREATE POLICY "Students can manage own profile"
ON student_profiles FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_student()
)
WITH CHECK (
  auth.uid() = user_id 
  AND is_student()
);

-- 管理员可以管理所有学生资料
CREATE POLICY "Admins can manage all student profiles"
ON student_profiles FOR ALL
TO authenticated
USING (is_admin());

-- 6. Instructor Profiles表RLS策略
-- =====================================================

-- 讲师可以管理自己的详细资料
CREATE POLICY "Instructors can manage own profile"
ON instructor_profiles FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_instructor()
)
WITH CHECK (
  auth.uid() = user_id 
  AND is_instructor()
);

-- 管理员可以管理所有讲师资料
CREATE POLICY "Admins can manage all instructor profiles"
ON instructor_profiles FOR ALL
TO authenticated
USING (is_admin());

-- 7. Applications表RLS策略
-- =====================================================

-- 学生可以管理自己的申请
CREATE POLICY "Students can manage own applications"
ON applications FOR ALL
TO authenticated
USING (
  auth.uid() = student_id 
  AND is_student()
)
WITH CHECK (
  auth.uid() = student_id 
  AND is_student()
);

-- 管理员可以管理所有申请（包括代投）
CREATE POLICY "Admins can manage all applications"
ON applications FOR ALL
TO authenticated
USING (is_admin());

-- 讲师可以查看学生的申请（用于指导）
CREATE POLICY "Instructors can view student applications"
ON applications FOR SELECT
TO authenticated
USING (is_instructor());

-- 8. Companies表RLS策略
-- =====================================================

-- 所有认证用户可以查看公司信息
CREATE POLICY "Anyone can view companies"
ON companies FOR SELECT
TO authenticated
USING (true);

-- 管理员可以管理公司信息
CREATE POLICY "Admins can manage companies"
ON companies FOR ALL
TO authenticated
USING (is_admin());

-- 9. Schedules表RLS策略
-- =====================================================

-- 用户可以管理自己的日程
CREATE POLICY "Users can manage own schedules"
ON schedules FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 管理员可以管理所有日程
CREATE POLICY "Admins can manage all schedules"
ON schedules FOR ALL
TO authenticated
USING (is_admin());

-- 讲师可以查看相关的日程（学生预约的辅导等）
CREATE POLICY "Instructors can view related schedules"
ON schedules FOR SELECT
TO authenticated
USING (
  is_instructor() 
  AND (
    instructor_id = auth.uid() 
    OR type = 'MENTORING'
  )
);

-- 10. Interviews表RLS策略
-- =====================================================

-- 学生可以查看自己的面试
CREATE POLICY "Students can view own interviews"
ON interviews FOR SELECT
TO authenticated
USING (
  is_student() 
  AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = interviews.application_id 
    AND applications.student_id = auth.uid()
  )
);

-- 管理员可以管理所有面试
CREATE POLICY "Admins can manage all interviews"
ON interviews FOR ALL
TO authenticated
USING (is_admin());

-- 讲师可以查看相关的面试（用于指导）
CREATE POLICY "Instructors can view related interviews"
ON interviews FOR SELECT
TO authenticated
USING (is_instructor());

-- 11. Notifications表RLS策略
-- =====================================================

-- 用户可以管理自己的通知
CREATE POLICY "Users can manage own notifications"
ON notifications FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 管理员可以管理所有通知
CREATE POLICY "Admins can manage all notifications"
ON notifications FOR ALL
TO authenticated
USING (is_admin());

-- 12. Feedback表RLS策略
-- =====================================================

-- 用户可以管理自己的反馈
CREATE POLICY "Users can manage own feedback"
ON feedback FOR ALL
TO authenticated
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
)
WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL
);

-- 管理员可以管理所有反馈
CREATE POLICY "Admins can manage all feedback"
ON feedback FOR ALL
TO authenticated
USING (is_admin());

-- 13. 创建索引以优化性能
-- =====================================================

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_administrator_id ON applications(administrator_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor_id ON schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- 14. 验证策略设置
-- =====================================================

-- 显示所有表的RLS状态
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'student_profiles', 'instructor_profiles', 
  'applications', 'companies', 'schedules', 
  'interviews', 'notifications', 'feedback'
)
ORDER BY tablename;

-- 显示所有策略
SELECT 
  schemaname,
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

-- =====================================================
-- 脚本执行完成
-- =====================================================
