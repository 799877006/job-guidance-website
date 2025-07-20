-- 1. 删除现有策略
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can manage their messages" ON user_messages;
DROP POLICY IF EXISTS "Admins can manage all user messages" ON user_messages;

-- 2. 为 messages 表创建更严格的策略
CREATE POLICY "Users can view related messages"
ON messages FOR SELECT
TO authenticated
USING (
  is_global = true OR 
  EXISTS (
    SELECT 1 FROM user_messages
    WHERE user_messages.message_id = id
    AND user_messages.user_id = auth.uid()
  )
);

-- 3. 为 user_messages 表创建策略
CREATE POLICY "Users can view their message status"
ON user_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their message status"
ON user_messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. 为管理员创建权限
CREATE POLICY "Admins can manage all messages"
ON messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage all user messages"
ON user_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 