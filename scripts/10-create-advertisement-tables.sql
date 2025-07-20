-- 创建求人广告表
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL,
  source TEXT NOT NULL, -- 来源（Indeed、マイナビ等）
  is_active BOOLEAN NOT NULL DEFAULT true,
  salary_range TEXT,
  location TEXT,
  employment_type TEXT,
  requirements TEXT,
  benefits TEXT[],
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- 添加user_id字段
);

-- 创建更新触发器
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加RLS策略
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有广告
CREATE POLICY "Admins can manage all advertisements"
ON advertisements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- 所有用户都可以查看激活状态的广告
CREATE POLICY "Users can view active advertisements"
ON advertisements FOR SELECT
USING (is_active = true);

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

-- 创建索引
CREATE INDEX idx_advertisements_posted_at ON advertisements(posted_at);
CREATE INDEX idx_advertisements_company_name ON advertisements(company_name);
CREATE INDEX idx_advertisements_source ON advertisements(source);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX idx_advertisements_user_id ON advertisements(user_id); -- 添加user_id索引

-- 添加注释
COMMENT ON TABLE advertisements IS '求人広告テーブル';
COMMENT ON COLUMN advertisements.title IS '求人タイトル';
COMMENT ON COLUMN advertisements.company_name IS '企業名';
COMMENT ON COLUMN advertisements.description IS '求人詳細';
COMMENT ON COLUMN advertisements.image_url IS '企業ロゴ画像URL';
COMMENT ON COLUMN advertisements.link_url IS '求人詳細ページURL';
COMMENT ON COLUMN advertisements.source IS '情報元（Indeed、マイナビなど）';
COMMENT ON COLUMN advertisements.is_active IS '有効フラグ';
COMMENT ON COLUMN advertisements.salary_range IS '給与範囲';
COMMENT ON COLUMN advertisements.location IS '勤務地';
COMMENT ON COLUMN advertisements.employment_type IS '雇用形態';
COMMENT ON COLUMN advertisements.requirements IS '応募要件';
COMMENT ON COLUMN advertisements.benefits IS '福利厚生';
COMMENT ON COLUMN advertisements.posted_at IS '掲載日時';
COMMENT ON COLUMN advertisements.created_at IS 'レコード作成日時';
COMMENT ON COLUMN advertisements.updated_at IS 'レコード更新日時';
COMMENT ON COLUMN advertisements.user_id IS '作成者ID'; 