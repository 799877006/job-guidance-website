-- 删除旧的策略
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own message status" ON user_messages;
DROP POLICY IF EXISTS "Users can update their own message status" ON user_messages;

-- Messages表的RLS策略
-- 1. 指导者可以管理所有消息
CREATE POLICY "Instructors can manage all messages"
ON messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'instructor'
  )
);

-- 2. 所有认证用户可以查看全局消息或发给自己的消息
CREATE POLICY "Users can view messages"
ON messages FOR SELECT
USING (
  is_global OR EXISTS (
    SELECT 1 FROM user_messages
    WHERE user_messages.message_id = messages.id
    AND user_messages.user_id = auth.uid()
  )
);

-- User Messages表的RLS策略
-- 1. 用户可以查看自己的消息状态
CREATE POLICY "Users can view their own message status"
ON user_messages FOR SELECT
USING (user_id = auth.uid());

-- 2. 用户可以更新自己的消息状态
CREATE POLICY "Users can update their own message status"
ON user_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. 指导者可以创建用户消息关联
CREATE POLICY "Instructors can create user messages"
ON user_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'instructor'
  )
);

-- 4. 指导者可以删除用户消息关联
CREATE POLICY "Instructors can delete user messages"
ON user_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'instructor'
  )
); 