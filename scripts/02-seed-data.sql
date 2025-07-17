-- Insert sample companies
INSERT INTO public.companies (name, industry, website, description) VALUES
('株式会社ABC', 'Technology', 'https://abc-corp.com', 'Leading technology company in Japan'),
('XYZ商事', 'Trading', 'https://xyz-trading.com', 'International trading company'),
('テック株式会社', 'Software', 'https://tech-corp.com', 'Software development company'),
('デザイン会社', 'Design', 'https://design-co.com', 'Creative design agency'),
('コンサル会社', 'Consulting', 'https://consulting.com', 'Business consulting firm');

-- Insert sample advertisements
INSERT INTO public.advertisements (title, description, company_name, image_url, link_url, is_active) VALUES
('新卒採用 - エンジニア募集', '最新技術を使った開発に携わりませんか？', '株式会社ABC', '/placeholder.svg?height=200&width=400', 'https://abc-corp.com/careers', true),
('インターンシップ募集', '実践的な経験を積める3ヶ月間のインターンシップ', 'テック株式会社', '/placeholder.svg?height=200&width=400', 'https://tech-corp.com/intern', true),
('デザイナー募集', 'クリエイティブなデザインワークに挑戦しませんか？', 'デザイン会社', '/placeholder.svg?height=200&width=400', 'https://design-co.com/jobs', true);
