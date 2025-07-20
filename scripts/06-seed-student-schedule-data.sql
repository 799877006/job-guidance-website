-- 学生时间管理种子数据
-- 注意：这些 student_id 需要替换为实际的学生用户 ID

-- 示例：为学生添加本周和下周的时间安排
-- 替换 'student-uuid-1' 为实际的学生 UUID

-- 本周时间安排示例
INSERT INTO public.student_schedule (student_id, date, start_time, end_time, schedule_type, title, description, location, color) VALUES
-- 周一
('student-uuid-1', CURRENT_DATE, '09:00', '10:30', 'class', 'データベース講義', 'MySQL基礎から応用まで', '第一講義室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE, '13:00', '14:30', 'class', 'アルゴリズム講義', 'ソートアルゴリズムの基礎', '情報処理室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE, '15:00', '17:00', 'free', '空き時間', '面接準備や個人学習に利用可能', NULL, '#10b981'),

-- 周二
('student-uuid-1', CURRENT_DATE + INTERVAL '1 day', '10:00', '11:30', 'class', 'ソフトウェア工学', 'アジャイル開発手法', '第二講義室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '1 day', '14:00', '16:00', 'interview', 'ABC株式会社 一次面接', 'エンジニア職の技術面接', 'オンライン会議', '#8b5cf6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '1 day', '16:30', '18:00', 'free', '空き時間', '面接後の振り返り時間', NULL, '#10b981'),

-- 周三
('student-uuid-1', CURRENT_DATE + INTERVAL '2 days', '09:00', '10:30', 'class', 'プロジェクト管理', 'スクラム手法の実践', '第三講義室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '2 days', '11:00', '12:00', 'busy', '履歴書作成', 'XYZ商事向けの履歴書準備', '図書館', '#ef4444'),
('student-uuid-1', CURRENT_DATE + INTERVAL '2 days', '14:00', '16:00', 'free', '空き時間', '指導面談やES作成に利用可能', NULL, '#10b981'),

-- 周四
('student-uuid-1', CURRENT_DATE + INTERVAL '3 days', '09:30', '11:00', 'class', 'ネットワーク基礎', 'TCP/IPプロトコルの理解', '情報処理室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '3 days', '13:00', '14:00', 'other', '就職課面談', 'キャリアカウンセラーとの相談', '就職支援室', '#6b7280'),
('student-uuid-1', CURRENT_DATE + INTERVAL '3 days', '15:00', '17:00', 'free', '空き時間', '企業研究や面接練習', NULL, '#10b981'),

-- 周五
('student-uuid-1', CURRENT_DATE + INTERVAL '4 days', '10:00', '11:30', 'class', 'データ構造', 'ツリー構造とグラフ理論', '第一講義室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '4 days', '13:30', '15:00', 'busy', 'ES提出準備', 'テック株式会社のES最終確認', 'カフェ', '#ef4444'),
('student-uuid-1', CURRENT_DATE + INTERVAL '4 days', '15:30', '17:30', 'free', '空き時間', '週末の準備と復習時間', NULL, '#10b981');

-- 下周时间安排示例
INSERT INTO public.student_schedule (student_id, date, start_time, end_time, schedule_type, title, description, location, color) VALUES
-- 下周一
('student-uuid-1', CURRENT_DATE + INTERVAL '7 days', '09:00', '10:30', 'class', 'システム設計', 'アーキテクチャパターンの学習', '第一講義室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '7 days', '14:00', '15:30', 'interview', 'テック株式会社 二次面接', 'チーム開発経験について', '本社会議室', '#8b5cf6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '7 days', '16:00', '18:00', 'free', '空き時間', 'プロジェクト作業時間', NULL, '#10b981'),

-- 下周二
('student-uuid-1', CURRENT_DATE + INTERVAL '8 days', '10:00', '12:00', 'class', 'ゼミナール', '卒業研究進捗報告', '研究室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '8 days', '13:00', '14:00', 'busy', '論文作成', '卒業論文の章立て検討', '図書館', '#ef4444'),
('student-uuid-1', CURRENT_DATE + INTERVAL '8 days', '15:00', '17:00', 'free', '空き時間', '指導教授との面談準備', NULL, '#10b981'),

-- 下周三
('student-uuid-1', CURRENT_DATE + INTERVAL '9 days', '09:00', '11:00', 'class', '情報セキュリティ', '暗号化技術の基礎', '情報処理室', '#3b82f6'),
('student-uuid-1', CURRENT_DATE + INTERVAL '9 days', '14:00', '15:00', 'other', 'サークル活動', '就活生向けセミナー運営', '学生会館', '#6b7280'),
('student-uuid-1', CURRENT_DATE + INTERVAL '9 days', '16:00', '18:00', 'free', '空き時間', 'グループワークや復習', NULL, '#10b981');

-- 如果有第二个学生，可以添加更多数据
-- INSERT INTO public.student_schedule (student_id, date, start_time, end_time, schedule_type, title, description, location, color) VALUES
-- ('student-uuid-2', CURRENT_DATE, '09:00', '10:30', 'class', '経済学概論', '市場経済の基本原理', '経済学部棟', '#3b82f6'),
-- ('student-uuid-2', CURRENT_DATE, '14:00', '16:00', 'free', '空き時間', '就職活動の準備時間', NULL, '#10b981');

-- 注意：实际使用时需要：
-- 1. 将 'student-uuid-1' 替换为真实的学生用户ID
-- 2. 根据实际情况调整日期
-- 3. 根据学校课程表调整上课时间和内容
-- 4. 确保时间不冲突 