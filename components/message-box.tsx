'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '@/components/auth-provider';
import { getUserMessages, getUnreadMessageCount, markMessageAsRead, markAllMessagesAsRead, getMessageTypeConfig } from '@/lib/message';
import type { MessageWithStatus } from '@/lib/types/message';

export function MessageBox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadUnreadCount();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!user) return;
    try {
      await markMessageAsRead(user.id, messageId);
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllMessagesAsRead(user.id);
      setMessages(messages.map(msg => ({ ...msg, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">メッセージ</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              すべて既読にする
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-1">
              {messages.map((message) => {
                const config = getMessageTypeConfig(message.message_type);
                return (
                  <div
                    key={message.id}
                    className={`p-4 border-b last:border-0 ${message.is_read ? '' : config.bgColor}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className={`font-medium ${config.color}`}>
                            {message.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            {format(new Date(message.created_at), 'MM/dd HH:mm', { locale: ja })}
                          </span>
                          {message.sender && (
                            <span>from {message.sender.full_name}</span>
                          )}
                        </div>
                      </div>
                      {!message.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleMarkAsRead(message.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2 text-gray-400" />
              <p>新しいメッセージはありません</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 