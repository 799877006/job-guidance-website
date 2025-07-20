-- 删除旧的策略
DROP POLICY IF EXISTS "Users can view active advertisements" ON advertisements;
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON advertisements;
DROP POLICY IF EXISTS "Admins can manage all advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can view own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can create own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can update own advertisements" ON advertisements;
DROP POLICY IF EXISTS "Authenticated users can delete own advertisements" ON advertisements;

-- 重新创建策略
-- 1. 允许所有人（包括未认证用户）查看激活的广告
CREATE POLICY "Anyone can view active advertisements"
ON advertisements FOR SELECT
USING (is_active = true);

-- 2. 指导者可以管理所有广告
CREATE POLICY "Instructors can manage all advertisements"
ON advertisements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'instructor'
  )
);

-- 3. 认证用户可以查看自己创建的广告（包括未激活的）
CREATE POLICY "Authenticated users can view own advertisements"
ON advertisements FOR SELECT
USING (auth.uid() = user_id);

-- 4. 认证用户可以创建广告
CREATE POLICY "Authenticated users can create advertisements"
ON advertisements FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. 认证用户可以更新自己的广告
CREATE POLICY "Authenticated users can update own advertisements"
ON advertisements FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. 认证用户可以删除自己的广告
CREATE POLICY "Authenticated users can delete own advertisements"
ON advertisements FOR DELETE
USING (auth.uid() = user_id); 