-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'instructor');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('applied', 'rejected', 'accepted', 'pending');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    age INTEGER,
    university TEXT,
    major TEXT,
    graduation_year INTEGER,
    bio TEXT,
    avatar_url TEXT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Companies table
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Applications table
CREATE TABLE public.applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'applied',
    applied_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Interviews table
CREATE TABLE public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status interview_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Feedback table
CREATE TABLE public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Advertisements table
CREATE TABLE public.advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    company_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.applications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interviews" ON public.interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interviews" ON public.interviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view active advertisements" ON public.advertisements FOR SELECT TO authenticated USING (is_active = true);

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
