-- 创建应募状态枚举类型
CREATE TYPE application_status AS ENUM (
  '書類選考中',
  '一次面接待ち',
  '一次面接完了',
  '二次面接待ち',
  '二次面接完了',
  '最終面接待ち',
  '最終面接完了',
  '内定',
  '不合格'
);

-- 创建应募管理表
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  status application_status NOT NULL DEFAULT '書類選考中',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  first_interview_at TIMESTAMP WITH TIME ZONE,
  second_interview_at TIMESTAMP WITH TIME ZONE,
  final_interview_at TIMESTAMP WITH TIME ZONE,
  offer_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建应募详情表（用于存储内定条件等信息）
CREATE TABLE application_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  annual_salary INTEGER,
  monthly_salary INTEGER,
  benefits TEXT[],
  location TEXT,
  work_hours TEXT,
  other_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_details_updated_at
  BEFORE UPDATE ON application_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_details ENABLE ROW LEVEL SECURITY;

-- Applications 表的RLS策略
CREATE POLICY "Users can view their own applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
ON applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
ON applications FOR DELETE
USING (auth.uid() = user_id);

-- Application Details 表的RLS策略
CREATE POLICY "Users can view their own application details"
ON application_details FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_details.application_id
    AND applications.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own application details"
ON application_details FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_details.application_id
    AND applications.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own application details"
ON application_details FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_details.application_id
    AND applications.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own application details"
ON application_details FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM applications
    WHERE applications.id = application_details.application_id
    AND applications.user_id = auth.uid()
  )
); 