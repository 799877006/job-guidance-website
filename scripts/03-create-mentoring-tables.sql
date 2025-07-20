-- 创建预约状态枚举
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rejected');

-- 导师可用时间表
CREATE TABLE public.instructor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 预约辅导表
CREATE TABLE public.mentoring_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    availability_id UUID REFERENCES public.instructor_availability(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    subject TEXT NOT NULL,
    description TEXT,
    student_notes TEXT,
    instructor_notes TEXT,
    meeting_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_booking_time CHECK (start_time < end_time)
);

-- 启用行级安全
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_bookings ENABLE ROW LEVEL SECURITY;

-- 导师可用时间的策略
CREATE POLICY "Instructors can manage own availability" ON public.instructor_availability 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'instructor' AND id = instructor_availability.instructor_id
    )
);

CREATE POLICY "Students can view instructor availability" ON public.instructor_availability 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'student'
    ) AND is_available = true
);

CREATE POLICY "Everyone can view available slots" ON public.instructor_availability 
FOR SELECT TO authenticated USING (is_available = true);

-- 预约的策略
CREATE POLICY "Students can manage own bookings" ON public.mentoring_bookings 
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Instructors can manage bookings for their sessions" ON public.mentoring_bookings 
FOR ALL USING (auth.uid() = instructor_id);

-- 创建触发器
CREATE TRIGGER handle_updated_at_availability 
BEFORE UPDATE ON public.instructor_availability 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_bookings 
BEFORE UPDATE ON public.mentoring_bookings 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 创建索引以提高查询性能
CREATE INDEX idx_instructor_availability_instructor_date ON public.instructor_availability(instructor_id, date);
CREATE INDEX idx_instructor_availability_date_available ON public.instructor_availability(date, is_available);
CREATE INDEX idx_mentoring_bookings_student ON public.mentoring_bookings(student_id);
CREATE INDEX idx_mentoring_bookings_instructor ON public.mentoring_bookings(instructor_id);
CREATE INDEX idx_mentoring_bookings_date ON public.mentoring_bookings(date);
CREATE INDEX idx_mentoring_bookings_status ON public.mentoring_bookings(status); 