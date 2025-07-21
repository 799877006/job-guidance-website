export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'instructor'
          age: number | null
          university: string | null
          major: string | null
          graduation_year: number | null
          bio: string | null
          avatar_url: string | null
          resume_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'student' | 'instructor'
          age?: number | null
          university?: string | null
          major?: string | null
          graduation_year?: number | null
          bio?: string | null
          avatar_url?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'instructor'
          age?: number | null
          university?: string | null
          major?: string | null
          graduation_year?: number | null
          bio?: string | null
          avatar_url?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          company_id: string
          position: string
          status: 'applied' | 'rejected' | 'accepted' | 'pending'
          applied_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          position: string
          status?: 'applied' | 'rejected' | 'accepted' | 'pending'
          applied_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          position?: string
          status?: 'applied' | 'rejected' | 'accepted' | 'pending'
          applied_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          application_id: string | null
          user_id: string
          company_name: string
          interview_type: string
          scheduled_date: string
          scheduled_time: string
          status: 'scheduled' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id?: string | null
          user_id: string
          company_name: string
          interview_type: string
          scheduled_date: string
          scheduled_time: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string | null
          user_id?: string
          company_name?: string
          interview_type?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          website: string | null
          description: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          created_at?: string
        }
      }
      advertisements: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          link_url: string | null
          company_name: string | null
          is_active: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          company_name?: string | null
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          company_name?: string | null
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          category: string
          subject: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          category: string
          subject: string
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          category?: string
          subject?: string
          message?: string
          status?: string
          created_at?: string
        }
      }
      instructor_availability: {
        Row: {
          id: string
          instructor_id: string
          date: string
          start_time: string
          end_time: string
          is_available: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          date: string
          start_time: string
          end_time: string
          is_available?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mentoring_bookings: {
        Row: {
          id: string
          student_id: string
          instructor_id: string
          availability_id: string
          date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
          subject: string
          description: string | null
          student_notes: string | null
          instructor_notes: string | null
          meeting_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          instructor_id: string
          availability_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
          subject: string
          description?: string | null
          student_notes?: string | null
          instructor_notes?: string | null
          meeting_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          instructor_id?: string
          availability_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
          subject?: string
          description?: string | null
          student_notes?: string | null
          instructor_notes?: string | null
          meeting_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'instructor'
      interview_status: 'scheduled' | 'completed' | 'cancelled'
      application_status: 'applied' | 'rejected' | 'accepted' | 'pending'
    }
  }
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  university: string | null
  major: string | null
  graduation_year: string | null
  role: 'student' | 'instructor' | 'admin'
  created_at: string
  updated_at: string
  // 指导者特有字段
  phone: string | null
  department: string | null
  position: string | null
  specialization: string | null
  bio: string | null
} 