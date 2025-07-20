-- 删除现有的消息表策略
DROP POLICY IF EXISTS "User can manage theris message" ON messages;

-- 重新创建消息表的策略
CREATE POLICY "Users can view their messages" ON messages
FOR SELECT
TO authenticated
USING (
  is_global OR EXISTS (
    SELECT 1 FROM user_messages
    WHERE user_messages.message_id = id
    AND user_messages.user_id = auth.uid()
  )
);

-- 添加管理员策略（如果需要）
CREATE POLICY "Admins can manage all messages" ON messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 