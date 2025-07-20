-- 首先确保有一些指导者账户
-- 注意：这些用户需要通过正常注册流程创建，这里只是更新角色

-- 插入一些指导者的可用时间（示例）
-- 注意：这些 instructor_id 需要替换为实际的指导者用户 ID

-- 示例：为指导者添加本周和下周的可用时间
-- 替换 'instructor-uuid-1' 为实际的指导者 UUID

-- 本周可用时间
INSERT INTO public.instructor_availability (instructor_id, date, start_time, end_time, notes) VALUES
('instructor-uuid-1', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', '面接対策専門'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '1 day', '14:00', '15:00', '業界研究相談'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '2 days', '10:00', '11:00', 'ES添削'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '3 days', '15:00', '16:00', '面接練習'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '4 days', '09:00', '10:00', 'キャリア相談');

-- 下周可用时间
INSERT INTO public.instructor_availability (instructor_id, date, start_time, end_time, notes) VALUES
('instructor-uuid-1', CURRENT_DATE + INTERVAL '7 days', '09:00', '10:00', '面接対策'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '7 days', '14:00', '15:00', 'グループディスカッション練習'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '8 days', '10:00', '11:00', '自己分析サポート'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '9 days', '15:00', '16:00', '企業研究'),
('instructor-uuid-1', CURRENT_DATE + INTERVAL '10 days', '11:00', '12:00', '総合面接対策');

-- 如果有第二个指导者，可以添加更多数据
-- INSERT INTO public.instructor_availability (instructor_id, date, start_time, end_time, notes) VALUES
-- ('instructor-uuid-2', CURRENT_DATE + INTERVAL '1 day', '11:00', '12:00', 'IT業界専門相談'),
-- ('instructor-uuid-2', CURRENT_DATE + INTERVAL '2 days', '16:00', '17:00', 'プログラマー面接対策');

-- 示例预约数据（可选）
-- 替换为实际的学生和指导者 UUID
-- INSERT INTO public.mentoring_bookings (student_id, instructor_id, availability_id, date, start_time, end_time, subject, description, status) VALUES
-- ('student-uuid-1', 'instructor-uuid-1', 'availability-uuid-1', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', '面接対策', 'IT企業の技術面接の準備をお願いします', 'confirmed'); 