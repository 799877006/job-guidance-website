export type MessageType = 'notification' | 'announcement' | 'alert';

export interface Message {
  id: string;
  title: string;
  content: string;
  message_type: MessageType;
  created_at: string;
  updated_at: string;
  is_global: boolean;
}

export interface UserMessage {
  id: string;
  user_id: string;
  message_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  message?: Message;
}

export interface MessageWithStatus extends Message {
  is_read: boolean;
  read_at: string | null;
} 