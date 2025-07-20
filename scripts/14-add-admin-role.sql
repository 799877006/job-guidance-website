-- 1. 删除依赖的策略
DROP POLICY IF EXISTS "Instructors can manage own availability" ON instructor_availability;
DROP POLICY IF EXISTS "Students can view instructor availability" ON instructor_availability;
DROP POLICY IF EXISTS "Students can manage own schedule" ON student_schedule;
DROP POLICY IF EXISTS "Instructors can view student schedules" ON student_schedule;
DROP POLICY IF EXISTS "Instructors can manage all advertisements" ON advertisements;

-- 2. 使用 CASCADE 删除 user_role 类型及其所有依赖
DROP TYPE IF EXISTS user_role CASCADE;

-- 3. 重新创建包含管理员角色的 user_role 类型
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- 4. 重新添加 role 列到 profiles 表
ALTER TABLE profiles
  ADD COLUMN role user_role NOT NULL DEFAULT 'student';

-- 5. 确保必要的列存在
DO $$ 
BEGIN 
  -- 检查并添加 user_id 列到 advertisements 表
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'advertisements' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE advertisements 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. 重新创建instructor_availability的策略
CREATE POLICY "Admins can manage all availability"
ON instructor_availability FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Instructors can manage own availability"
ON instructor_availability FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'instructor' OR profiles.role = 'admin')
  )
  AND instructor_id = auth.uid()
);

CREATE POLICY "Students can view instructor availability"
ON instructor_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
);

-- 7. 重新创建student_schedule的策略
CREATE POLICY "Admins can manage all schedules"
ON student_schedule FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Students can manage own schedule"
ON student_schedule FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
  AND student_id = auth.uid()
);

CREATE POLICY "Instructors can view student schedules"
ON student_schedule FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'instructor' OR profiles.role = 'admin')
  )
);

-- 8. 重新创建mentoring_bookings的策略
CREATE POLICY "Admins can manage all bookings"
ON mentoring_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Students can manage own bookings"
ON mentoring_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
  AND student_id = auth.uid()
);

CREATE POLICY "Instructors can manage bookings for their sessions"
ON mentoring_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'instructor' OR profiles.role = 'admin')
  )
  AND instructor_id = auth.uid()
);

-- 9. 更新现有表的 RLS 策略

-- Profiles 表
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Admins can manage all profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Applications 表
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

CREATE POLICY "Admins can manage all applications"
ON applications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view own applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
ON applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
ON applications FOR DELETE
USING (auth.uid() = user_id);

-- Interviews 表
DROP POLICY IF EXISTS "Users can view own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete own interviews" ON interviews;

CREATE POLICY "Admins can manage all interviews"
ON interviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view own interviews"
ON interviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
ON interviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
ON interviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
ON interviews FOR DELETE
USING (auth.uid() = user_id);

-- Feedback 表
DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

CREATE POLICY "Admins can manage all feedback"
ON feedback FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON feedback FOR SELECT
USING (auth.uid() = user_id);

-- Companies 表
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;

CREATE POLICY "Admins can manage all companies"
ON companies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view companies"
ON companies FOR SELECT
TO authenticated
USING (true);

-- Messages 表
DROP POLICY IF EXISTS "Instructors can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;

CREATE POLICY "Admins can manage all messages"
ON messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view messages"
ON messages FOR SELECT
USING (
  is_global OR EXISTS (
    SELECT 1 FROM user_messages
    WHERE user_messages.message_id = messages.id
    AND user_messages.user_id = auth.uid()
  )
);

-- User Messages 表
DROP POLICY IF EXISTS "Users can view their own message status" ON user_messages;
DROP POLICY IF EXISTS "Users can update their own message status" ON user_messages;
DROP POLICY IF EXISTS "Instructors can create user messages" ON user_messages;
DROP POLICY IF EXISTS "Instructors can delete user messages" ON user_messages;

CREATE POLICY "Admins can manage all user messages"
ON user_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own message status"
ON user_messages FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own message status"
ON user_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Advertisements 表
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can view own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can create advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can update own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can delete own advertisements" ON advertisements;

CREATE POLICY "Admins can manage all advertisements"
ON advertisements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view active advertisements"
ON advertisements FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view own advertisements"
ON advertisements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create advertisements"
ON advertisements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own advertisements"
ON advertisements FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own advertisements"
ON advertisements FOR DELETE
USING (auth.uid() = user_id); 