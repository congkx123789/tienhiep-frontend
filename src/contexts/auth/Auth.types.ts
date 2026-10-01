/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  Auth.types.ts
 * ═════════════════════════════════════════════════════════════════════════════
 */

export interface AuthUser {
  id?: string | number;
  username: string;
  email?: string;
  vip_status?: number;
  vip_expire?: string;
  require_password_change?: number;
  sect_id?: string | number;
  sect_role?: string;
  avatar?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (username: string, password: string, email?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
