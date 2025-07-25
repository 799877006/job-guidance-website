export type ApplicationStatus = 
  | '書類選考中'
  | '一次面接待ち'
  | '一次面接完了'
  | '二次面接待ち'
  | '二次面接完了'
  | '最終面接待ち'
  | '最終面接完了'
  | '内定'
  | '不合格';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  status: ApplicationStatus;
  applied_at: string;
  first_interview_at: string | null;
  second_interview_at: string | null;
  final_interview_at: string | null;
  first_interview_end: string | null;
  second_interview_end: string | null;
  final_interview_end: string | null;
  offer_received_at: string | null;
  created_at: string;
  updated_at: string;
  annual_salary: number | null;
  monthly_salary: number | null;
  benefits: string[];
  location: string | null;
  work_hours: string | null;
  other_conditions: string | null;
}

export interface ApplicationWithDetails extends Application {
  details?: {
    id: string;
    application_id: string;
    annual_salary: number | null;
    monthly_salary: number | null;
    benefits: string[];
    location: string | null;
    work_hours: string | null;
    other_conditions: string | null;
  } | null;
} 