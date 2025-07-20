-- 1. 删除旧的策略
DROP POLICY IF EXISTS "Students can manage own schedule" ON student_schedule;
DROP POLICY IF EXISTS "Instructors can manage own availability" ON instructor_availability;
DROP POLICY IF EXISTS "Students can manage own bookings" ON mentoring_bookings;
DROP POLICY IF EXISTS "Instructors can manage bookings for their sessions" ON mentoring_bookings;

-- 2. 重新创建策略，使用正确的列名
-- student_schedule 表策略
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

-- instructor_availability 表策略
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

-- mentoring_bookings 表策略
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