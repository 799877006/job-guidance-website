-- 创建消息类型枚举
CREATE TYPE message_type AS ENUM (
  'notification',  -- 通知
  'announcement', -- 公告
  'alert'         -- 警告
);

-- 创建消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'notification',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_global BOOLEAN NOT NULL DEFAULT false -- 是否全局消息
);

-- 创建用户消息关联表（用于追踪消息的阅读状态）
CREATE TABLE user_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- 创建更新触发器
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_messages_updated_at
  BEFORE UPDATE ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加RLS策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Messages表的RLS策略
CREATE POLICY "Admins can manage all messages"
ON messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

CREATE POLICY "Users can view messages"
ON messages FOR SELECT
USING (
  is_global OR EXISTS (
    SELECT 1 FROM user_messages
    WHERE user_messages.message_id = messages.id
    AND user_messages.user_id = auth.uid()
  )
);

-- User Messages表的RLS策略
CREATE POLICY "Users can view their own message status"
ON user_messages FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own message status"
ON user_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 创建索引
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX idx_user_messages_message_id ON user_messages(message_id);
CREATE INDEX idx_user_messages_is_read ON user_messages(is_read); 