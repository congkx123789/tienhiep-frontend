/**
 * accountStorage.ts — Quản lý lưu trữ LocalStorage phân tách theo từng tài khoản (Account-Scoped Storage)
 * Giúp dữ liệu cục bộ (Lịch sử web, Bookmarks, Tabs, Offline Books) của tài khoản A
 * hoàn toàn độc lập, không bị rò rỉ sang tài khoản B hoặc Guest.
 */

export function getStoredUser(): any {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccountScope(): string {
  try {
    const u = getStoredUser();
    if (u?.id) return `u_${u.id}`;
    if (u?.username) return `u_${u.username}`;
  } catch {}
  return 'guest';
}

export function getAccountKey(baseKey: string, customScope?: string): string {
  const scope = customScope || getAccountScope();
  return `${scope}:${baseKey}`;
}

export function getAccountItem<T = any>(baseKey: string, fallback: T, customScope?: string): T {
  try {
    const key = getAccountKey(baseKey, customScope);
    const val = localStorage.getItem(key);
    if (val !== null) {
      return JSON.parse(val);
    }

    // Cơ chế tương thích ngược (Backward Compatibility):
    // Nếu chưa có key theo account, kiểm tra key cũ không có tiền tố để migrate dữ liệu
    const legacy = localStorage.getItem(baseKey);
    if (legacy !== null) {
      try {
        const parsed = JSON.parse(legacy);
        // Lưu sang key phân tách theo account
        localStorage.setItem(key, legacy);
        return parsed;
      } catch {
        return legacy as unknown as T;
      }
    }
  } catch {}
  return fallback;
}

export function setAccountItem(baseKey: string, value: any, customScope?: string): void {
  try {
    const key = getAccountKey(baseKey, customScope);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[accountStorage] Failed to set item for key: ${baseKey}`, err);
  }
}

export function removeAccountItem(baseKey: string, customScope?: string): void {
  try {
    const key = getAccountKey(baseKey, customScope);
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Xóa toàn bộ dữ liệu cục bộ của một scope tài khoản (khi người dùng xóa dữ liệu cá nhân)
 */
export function clearAllAccountData(customScope?: string): void {
  const scope = customScope || getAccountScope();
  const prefix = `${scope}:`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      keysToRemove.push(k);
    }
  }

  keysToRemove.forEach(k => localStorage.removeItem(k));
}
