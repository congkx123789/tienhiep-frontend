export interface FriendItem {
  id: number | string;
  username: string;
  avatar?: string;
  user_code?: string;
  unread_messages: number;
  is_online?: boolean;
}

export interface ChatMessage {
  id: number | string;
  sender_id: number | string;
  receiver_id?: number | string;
  message: string;
  created_at: string;
  is_read?: number;
  sender_name?: string;
  sender_avatar?: string;
  vip_status?: number;
}

export type ChatChannel = 'global' | 'direct';
