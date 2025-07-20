-- 添加user_id字段
ALTER TABLE advertisements
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX idx_advertisements_user_id ON advertisements(user_id);

-- 更新现有记录的user_id（如果需要）
-- UPDATE advertisements SET user_id = '默认管理员ID' WHERE user_id IS NULL;

-- 重新创建或更新RLS策略
DROP POLICY IF EXISTS "Authenticated users can view own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can create own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can update own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can delete own advertisements" ON advertisements;

-- 认证用户可以查看自己的广告
CREATE POLICY "Authenticated users can view own advertisements"
ON advertisements FOR SELECT
USING (auth.uid() = user_id);

-- 认证用户可以创建自己的广告
CREATE POLICY "Authenticated users can create own advertisements"
ON advertisements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 认证用户可以更新自己的广告
CREATE POLICY "Authenticated users can update own advertisements"
ON advertisements FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 认证用户可以删除自己的广告
CREATE POLICY "Authenticated users can delete own advertisements"
ON advertisements FOR DELETE
USING (auth.uid() = user_id); 