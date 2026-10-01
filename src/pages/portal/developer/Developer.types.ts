export interface ApiKeyItem {
  id?: number | string;
  name: string;
  api_key: string;
  created_at: string;
  is_active?: boolean;
}

export interface UsageItem {
  id?: number | string;
  model: string;
  tokens?: number;
  cost?: number;
  timestamp: string;
  status_code: number;
  ip_address?: string;
}

export interface SandboxTtsParams {
  text: string;
  speed: number;
}

export interface SandboxTransParams {
  text: string;
  mode: string;
}
