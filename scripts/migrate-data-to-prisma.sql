-- 数据迁移脚本：从旧的 Supabase 表结构迁移到新的 Prisma 表结构
-- 执行前请确保已经运行了 Prisma db push 创建了新的表结构
-- 执行命令：psql $DATABASE_URL -f scripts/migrate-data-to-prisma.sql

-- ============================================
-- 第一步：迁移用户数据
-- ============================================

-- 从 profiles 表迁移基本用户数据到 users 表
INSERT INTO users (
    id,
    email,
    name,
    role,
    phone,
    "avatarUrl",
    bio,
    "createdAt",
    "updatedAt"
)
SELECT 
    id,
    email,
    COALESCE(full_name, email) as name, -- 如果没有 full_name，使用 email
    CASE 
        WHEN role = 'student' THEN 'STUDENT'::user_role
        WHEN role = 'instructor' THEN 'INSTRUCTOR'::user_role
        ELSE 'STUDENT'::user_role
    END as role,
    NULL as phone, -- 旧表中没有 phone 字段
    avatar_url,
    bio,
    created_at,
    updated_at
FROM profiles
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    "avatarUrl" = EXCLUDED."avatarUrl",
    bio = EXCLUDED.bio,
    "updatedAt" = EXCLUDED."updatedAt";

-- ============================================
-- 第二步：迁移学生详细资料
-- ============================================

-- 从 profiles 表迁移学生资料到 student_profiles 表
INSERT INTO student_profiles (
    id,
    "userId",
    university,
    major,
    "graduationYear",
    skills,
    languages,
    "resumeUrl",
    "preferredLocations",
    "expectedSalary",
    "formerSalary",
    "availableStartDate",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as id,
    p.id as "userId",
    COALESCE(p.university, 'Unknown University') as university, -- 必填字段
    COALESCE(p.major, 'Unknown Major') as major, -- 必填字段
    COALESCE(p.graduation_year, EXTRACT(YEAR FROM CURRENT_DATE) + 1) as "graduationYear", -- 必填字段
    ARRAY[]::text[] as skills, -- 旧表中没有，设置为空数组
    ARRAY[]::text[] as languages,
    COALESCE(p.resume_url, '') as "resumeUrl", -- 必填字段，如果为空设置为空字符串
    ARRAY[]::text[] as "preferredLocations",
    NULL::float as "expectedSalary",
    NULL::float as "formerSalary",
    NULL::timestamp as "availableStartDate",
    p.created_at as "createdAt",
    p.updated_at as "updatedAt"
FROM profiles p
WHERE p.role = 'student'
ON CONFLICT ("userId") DO NOTHING;

-- ============================================
-- 第三步：迁移讲师详细资料
-- ============================================

-- 从 profiles 表迁移讲师资料到 instructor_profiles 表
INSERT INTO instructor_profiles (
    id,
    "userId",
    nationality,
    experience,
    "educationBackground",
    introduction,
    "resumePdfUrl",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as id,
    p.id as "userId",
    'Unknown' as nationality, -- 必填字段，旧表中没有
    NULL::integer as experience,
    NULL::text as "educationBackground",
    p.bio as introduction,
    p.resume_url as "resumePdfUrl",
    p.created_at as "createdAt",
    p.updated_at as "updatedAt"
FROM profiles p
WHERE p.role = 'instructor'
ON CONFLICT ("userId") DO NOTHING;

-- ============================================
-- 第四步：迁移公司数据
-- ============================================

-- 从 companies 表迁移到 companies 表（字段基本一致）
INSERT INTO companies (
    id,
    name,
    position,
    description,
    location,
    benefits,
    "workHours",
    "createdAt",
    "updatedAt"
)
SELECT 
    id,
    name,
    'Unknown Position' as position, -- 新表中必填字段，旧表中没有
    description,
    COALESCE(industry, 'Other') as location, -- 使用 industry 作为 location
    ARRAY[]::text[] as benefits, -- 旧表中没有
    '9:00-18:00' as "workHours", -- 新表中必填字段，旧表中没有
    created_at as "createdAt",
    created_at as "updatedAt"
FROM companies
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    "updatedAt" = EXCLUDED."updatedAt";

-- ============================================
-- 第五步：迁移申请数据
-- ============================================

-- 从 applications 表迁移到 applications 表
-- 注意：需要根据新表结构调整字段
INSERT INTO applications (
    id,
    "studentId",
    "companyId",
    status,
    "appliedAt",
    "casualInterviewAt",
    "casualInterviewEnd",
    "firstInterviewAt",
    "secondInterviewAt",
    "finalInterviewAt",
    "firstInterviewEnd",
    "secondInterviewEnd",
    "finalInterviewEnd",
    "offerReceivedAt",
    "annualSalary",
    "monthlySalary",
    benefits,
    location,
    "workHours",
    "otherConditions",
    "createdAt",
    "updatedAt"
)
SELECT 
    a.id,
    a.user_id as "studentId",
    a.company_id as "companyId",
    CASE 
        WHEN a.status = 'applied' THEN 'DOCUMENT_SCREENING'::application_status
        WHEN a.status = 'rejected' THEN 'REJECTED'::application_status
        WHEN a.status = 'accepted' THEN 'OFFER_RECEIVED'::application_status
        WHEN a.status = 'pending' THEN 'DOCUMENT_SCREENING'::application_status
        ELSE 'DOCUMENT_SCREENING'::application_status
    END as status,
    a.applied_date::timestamp as "appliedAt",
    NULL::timestamp as "casualInterviewAt",
    NULL::timestamp as "casualInterviewEnd",
    NULL::timestamp as "firstInterviewAt",
    NULL::timestamp as "secondInterviewAt",
    NULL::timestamp as "finalInterviewAt",
    NULL::timestamp as "firstInterviewEnd",
    NULL::timestamp as "secondInterviewEnd",
    NULL::timestamp as "finalInterviewEnd",
    NULL::timestamp as "offerReceivedAt",
    NULL::float as "annualSalary",
    NULL::float as "monthlySalary",
    ARRAY[]::text[] as benefits,
    NULL::text as location,
    NULL::text as "workHours",
    a.notes as "otherConditions",
    a.created_at as "createdAt",
    a.updated_at as "updatedAt"
FROM applications a
WHERE EXISTS (SELECT 1 FROM users WHERE id = a.user_id)
  AND EXISTS (SELECT 1 FROM companies WHERE id = a.company_id)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    "otherConditions" = EXCLUDED."otherConditions",
    "updatedAt" = EXCLUDED."updatedAt";

-- ============================================
-- 第六步：迁移面试数据
-- ============================================

-- 从 interviews 表迁移到 interviews 表
INSERT INTO interviews (
    id,
    "applicationId",
    "startTime",
    "endTime",
    status,
    type,
    notes,
    "createdAt",
    "updatedAt"
)
SELECT 
    i.id,
    i.application_id as "applicationId",
    (i.scheduled_date::date + i.scheduled_time::time)::timestamp as "startTime",
    (i.scheduled_date::date + i.scheduled_time::time + INTERVAL '1 hour')::timestamp as "endTime", -- 默认1小时
    CASE 
        WHEN i.status = 'scheduled' THEN 'SCHEDULED'::interview_status
        WHEN i.status = 'completed' THEN 'COMPLETED'::interview_status
        WHEN i.status = 'cancelled' THEN 'CANCELLED'::interview_status
        ELSE 'SCHEDULED'::interview_status
    END as status,
    CASE 
        WHEN i.interview_type ILIKE '%first%' OR i.interview_type ILIKE '%一次%' THEN 'FIRST'::interview_type
        WHEN i.interview_type ILIKE '%second%' OR i.interview_type ILIKE '%二次%' THEN 'SECOND'::interview_type
        WHEN i.interview_type ILIKE '%final%' OR i.interview_type ILIKE '%最終%' THEN 'FINAL'::interview_type
        WHEN i.interview_type ILIKE '%casual%' OR i.interview_type ILIKE '%カジュアル%' THEN 'CASUAL'::interview_type
        ELSE 'OTHER'::interview_type
    END as type,
    i.notes,
    i.created_at as "createdAt",
    i.updated_at as "updatedAt"
FROM interviews i
WHERE i.application_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM applications WHERE id = i.application_id)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    "updatedAt" = EXCLUDED."updatedAt";

-- ============================================
-- 第七步：迁移反馈数据
-- ============================================

-- 从 feedback 表迁移到 feedback 表
INSERT INTO feedback (
    id,
    "userId",
    name,
    email,
    category,
    subject,
    message,
    status,
    "createdAt"
)
SELECT 
    id,
    user_id as "userId",
    name,
    email,
    category,
    subject,
    message,
    status,
    created_at as "createdAt"
FROM feedback
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- ============================================
-- 第八步：创建日程数据（基于面试）
-- ============================================

-- 为每个面试创建对应的日程
INSERT INTO schedules (
    id,
    "userId",
    title,
    "startTime",
    "endTime",
    status,
    type,
    "applicationId",
    "companyName",
    notes,
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as id,
    a."studentId" as "userId",
    c.name || ' - ' || 
    CASE 
        WHEN i.type = 'FIRST' THEN '一次面接'
        WHEN i.type = 'SECOND' THEN '二次面接'
        WHEN i.type = 'FINAL' THEN '最終面接'
        WHEN i.type = 'CASUAL' THEN 'カジュアル面接'
        ELSE 'その他面接'
    END as title,
    i."startTime",
    i."endTime",
    CASE 
        WHEN i.status = 'SCHEDULED' THEN 'SCHEDULED'::schedule_status
        WHEN i.status = 'COMPLETED' THEN 'COMPLETED'::schedule_status
        WHEN i.status = 'CANCELLED' THEN 'CANCELLED'::schedule_status
        ELSE 'SCHEDULED'::schedule_status
    END as status,
    'INTERVIEW'::schedule_type as type,
    i."applicationId",
    c.name as "companyName",
    i.notes,
    i."createdAt",
    i."updatedAt"
FROM interviews i
JOIN applications a ON i."applicationId" = a.id
JOIN companies c ON a."companyId" = c.id
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '数据迁移完成！';
    RAISE NOTICE '迁移的数据：';
    RAISE NOTICE '- 用户: % 条', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '- 学生资料: % 条', (SELECT COUNT(*) FROM student_profiles);
    RAISE NOTICE '- 讲师资料: % 条', (SELECT COUNT(*) FROM instructor_profiles);
    RAISE NOTICE '- 公司: % 条', (SELECT COUNT(*) FROM companies);
    RAISE NOTICE '- 申请: % 条', (SELECT COUNT(*) FROM applications);
    RAISE NOTICE '- 面试: % 条', (SELECT COUNT(*) FROM interviews);
    RAISE NOTICE '- 日程: % 条', (SELECT COUNT(*) FROM schedules);
    RAISE NOTICE '- 反馈: % 条', (SELECT COUNT(*) FROM feedback);
END $$;

