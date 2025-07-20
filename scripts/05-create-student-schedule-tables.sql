-- 创建学生时间类型枚举
CREATE TYPE schedule_type AS ENUM ('free', 'busy', 'class', 'interview', 'other');

-- 学生时间安排表
CREATE TABLE public.student_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    schedule_type schedule_type NOT NULL DEFAULT 'free',
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- 默认蓝色
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 启用行级安全
ALTER TABLE public.student_schedule ENABLE ROW LEVEL SECURITY;

-- 学生时间安排的策略 - 学生只能管理自己的时间表
CREATE POLICY "Students can manage own schedule" ON public.student_schedule 
FOR ALL USING (
    auth.uid() = student_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'student'
    )
);

-- 指导老师可以查看学生的时间表（用于安排指导时间）
CREATE POLICY "Instructors can view student schedules" ON public.student_schedule 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'instructor'
    )
);

-- 创建触发器
CREATE TRIGGER handle_updated_at_student_schedule 
BEFORE UPDATE ON public.student_schedule 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 创建索引以提高查询性能
CREATE INDEX idx_student_schedule_student_date ON public.student_schedule(student_id, date);
CREATE INDEX idx_student_schedule_date_type ON public.student_schedule(date, schedule_type);
CREATE INDEX idx_student_schedule_time_range ON public.student_schedule(date, start_time, end_time); 