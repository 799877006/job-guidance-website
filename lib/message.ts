import { supabase } from './supabase';
import type { Message, UserMessage, MessageWithStatus } from './types/message';

export async function getUserMessages(userId: string): Promise<MessageWithStatus[]> {
  const { data, error } = await supabase
    .from('user_messages')
    .select(`
      *,
      message:messages(
        *,
        sender:sender_id(
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((userMessage: UserMessage) => ({
    ...userMessage.message!,
    is_read: userMessage.is_read,
    read_at: userMessage.read_at
  }));
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_messages')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markMessageAsRead(userId: string, messageId: string) {
  const { error } = await supabase
    .from('user_messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('message_id', messageId);

  if (error) throw error;
}

export async function markAllMessagesAsRead(userId: string) {
  const { error } = await supabase
    .from('user_messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export function getMessageTypeConfig(type: Message['message_type']) {
  switch (type) {
    case 'notification':
      return {
        icon: '🔔',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    case 'announcement':
      return {
        icon: '📢',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    case 'alert':
      return {
        icon: '⚠️',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
  }
} 