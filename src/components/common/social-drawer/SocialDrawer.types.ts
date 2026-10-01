/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  SocialDrawer.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface FriendItem {
  id: string | number;
  username: string;
  avatar?: string;
  user_code?: string;
  unread_messages?: number;
  [key: string]: any;
}

export interface NotifItem {
  id: string | number;
  message: string;
  type: string;
  is_read: boolean;
  sender_id?: string | number;
  related_id?: string | number;
  created_at: string;
}

export interface ChatMessage {
  id: string | number;
  sender_id: string | number;
  receiver_id: string | number;
  message: string;
  created_at: string;
}

export interface SearchUserItem {
  id: string | number;
  username: string;
  avatar?: string;
  user_code?: string;
}

export interface SocialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'friends' | 'search' | 'notifications';
}
