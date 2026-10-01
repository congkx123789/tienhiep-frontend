export interface FriendItem {
  id: number | string;
  username: string;
  avatar?: string;
  user_code?: string;
  unread_messages: number;
}

export interface ChatMessage {
  id: number | string;
  sender_id: number | string;
  receiver_id: number | string;
  message: string;
  created_at: string;
  is_read?: number;
}
