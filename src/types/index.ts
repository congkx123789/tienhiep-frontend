/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  GLOBAL TYPES & INTERFACES — TIÊN HIỆP AI READER
 * ═════════════════════════════════════════════════════════════════════════════
 */

// ─── 1. NỀN TẢNG (PLATFORM) ───
export type PlatformType = 'web' | 'electron' | 'android' | 'ios';

export interface BasePointConfig {
  DEFAULT_PORT: number;
  LOCAL_HOST: string;
  EMULATOR_HOST: string;
  REMOTE_HOST: string;
  HEALTH_TIMEOUT_MS: number;
  CACHE_KEY: string;
  CACHE_DURATION_MS: number;
}

// ─── 2. SÁCH & CHƯƠNG (BOOKS & CHAPTERS) ───
export interface Book {
  id: number;
  title: string;
  author: string;
  cover?: string;
  category?: string;
  status?: string;
  views?: number;
  rating?: number;
  description?: string;
  latest_chapter?: string;
  source_url?: string;
  TitleVietphrase?: string;
  TitleHanviet?: string;
  DescriptionVietphrase?: string;
  updated_at?: string;
  created_at?: string;
}

export interface Chapter {
  id: number | string;
  book_id: number;
  title: string;
  content?: string;
  translated_content?: string;
  prev_id?: number | string | null;
  next_id?: number | string | null;
  chapter_number?: number;
}

export interface BooksSearchResponse {
  books: Book[];
  total: number;
  page: number;
  per_page: number;
  author?: string;
}

// ─── 3. NGƯỜI DÙNG & XÁC THỰC (USER & AUTH) ───
export interface User {
  id: number | string;
  username: string;
  email?: string;
  avatar?: string;
  vip_status?: number;
  vip_plan?: string;
  vip_expiry?: string;
  unlocked_tools?: string[];
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  logged_in?: boolean;
  authenticated?: boolean;
  user?: User;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  message?: string;
  error?: string;
}

export interface VIPStatusResponse {
  success: boolean;
  is_active: boolean;
  days_remaining: number;
  user_id?: string;
  username?: string;
  unlocked_tools?: string[];
  plan?: string;
}

// ─── 4. TÔNG MÔN (SECTS) ───
export interface Sect {
  id: number;
  name: string;
  description: string;
  leader_id: number | string;
  leader_name?: string;
  members_count: number;
  level?: number;
  points?: number;
  avatar?: string;
  announcement?: string;
  created_at?: string;
}

export interface SectMember {
  user_id: number | string;
  username: string;
  role: 'leader' | 'elder' | 'disciple';
  contribution: number;
  joined_at: string;
}

export interface SectChatMessage {
  id: number | string;
  sect_id: number;
  user_id: number | string;
  username: string;
  avatar?: string;
  message: string;
  created_at: string;
}

// ─── 5. DỊCH THUẬT & TTS (TRANSLATION & AUDIO) ───
export type TranslationEngine = 'cmlm' | 'vietphrase' | 'hanviet' | 'google' | 'hybrid';

export interface TranslationResult {
  result?: string;
  translation?: string;
  text?: string;
  engine: string;
  status: string;
  elapsed_ms?: number;
}

export interface ReaderPreferences {
  theme: 'dark' | 'light' | 'sepia' | 'oled';
  font_size: number;
  line_height: number;
  font_family?: string;
  engine: TranslationEngine;
  voice: string;
  speed: number;
}
