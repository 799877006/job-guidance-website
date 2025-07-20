-- 添加新字段到 applications 表
ALTER TABLE applications
  -- interviews 表特有的字段
  ADD COLUMN IF NOT EXISTS interview_location text,
  ADD COLUMN IF NOT EXISTS interview_notes text,
  ADD COLUMN IF NOT EXISTS interview_status text DEFAULT 'scheduled' CHECK (interview_status IN ('scheduled', 'completed', 'cancelled')),
  -- 修改现有字段的约束
  ALTER COLUMN status TYPE text,
  ALTER COLUMN status SET DEFAULT '書類選考中';

-- 更新 RLS 策略
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON applications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON applications
  FOR DELETE
  USING (auth.uid() = user_id);

-- 数据迁移：将 interviews 表的数据合并到 applications 表
INSERT INTO applications (
  company_name,
  position,
  status,
  user_id,
  interview_location,
  interview_notes,
  interview_status,
  first_interview_at,
  created_at,
  updated_at
)
SELECT 
  company_name,
  '未指定' as position,
  '一次面接待ち' as status,
  user_id,
  location as interview_location,
  notes as interview_notes,
  status as interview_status,
  scheduled_date || 'T' || scheduled_time as first_interview_at,
  created_at,
  updated_at
FROM interviews
ON CONFLICT DO NOTHING;

-- 可以选择保留 interviews 表作为历史记录，或者删除它
-- DROP TABLE interviews; 