-- 1. 首先确保 RLS 已启用
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有的策略
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Users can manage their all message" ON user_messages;
DROP POLICY IF EXISTS "User can manage theris message" ON messages;

-- 3. 为 messages 表创建基本的查看策略
CREATE POLICY "Anyone can view messages"
ON messages FOR SELECT
TO authenticated
USING (true);

-- 4. 为 user_messages 表创建完整的策略
CREATE POLICY "Users can manage their messages"
ON user_messages
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- 5. 为管理员创建完整访问权限
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

-- 6. 验证权限设置
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('messages', 'user_messages'); 