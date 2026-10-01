export type SectRole = 'leader' | 'vice_leader' | 'elder' | 'inner_disciple' | 'member';

export const ROLE_ORDER: Record<SectRole, number> = {
  leader: 1,
  vice_leader: 2,
  elder: 3,
  inner_disciple: 4,
  member: 5
};

export const ROLE_LABELS: Record<SectRole, string> = {
  leader: "Tông chủ",
  vice_leader: "Phó Tông chủ",
  elder: "Trưởng lão",
  inner_disciple: "Nội môn đệ tử",
  member: "Ngoại môn đệ tử"
};

export interface SectMember {
  user_id: number;
  id?: number;
  username: string;
  display_name?: string;
  avatar?: string;
  role: SectRole;
  contributions: number;
  joined_at?: string;
}

export interface SectItem {
  id: number;
  name: string;
  slogan: string;
  badge: string;
  leader_name?: string;
  leader_id?: number;
  members_count: number;
  total_contributions: number;
  announcement?: string;
  created_at?: string;
}

export interface JoinRequest {
  id: number;
  user_id: number;
  username: string;
  avatar?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  avatar?: string;
  role?: SectRole;
  message: string;
  created_at: string;
}

export interface SubGroup {
  id: number;
  name: string;
  members_count: number;
  created_by?: number;
  members?: SectMember[];
}
