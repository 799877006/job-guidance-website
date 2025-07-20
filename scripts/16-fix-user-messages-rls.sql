-- 删除现有的策略
DROP POLICY IF EXISTS "Users can view their own message status" ON user_messages;
DROP POLICY IF EXISTS "Users can update their own message status" ON user_messages;

-- 重新创建策略，明确指定认证用户
CREATE POLICY "Users can view their own message status"
ON user_messages 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own message status"
ON user_messages 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 添加管理员策略（如果需要）
CREATE POLICY "Admins can manage all messages"
ON user_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 