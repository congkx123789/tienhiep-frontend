/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  authTokenStorage.ts — QUẢN LÝ LƯU TRỮ VÀ ĐỒNG BỘ TOKEN TRÊN ĐA NỀN TẢNG
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { AuthUser } from './Auth.types';

export const saveAuthTokens = async (accessToken?: string, refreshToken?: string, user?: AuthUser | null) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
    if ((window as any).electron?.storeSet) {
      await (window as any).electron.storeSet('accessToken', accessToken);
    }
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    if ((window as any).electron?.storeSet) {
      await (window as any).electron.storeSet('refreshToken', refreshToken);
    }
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    if ((window as any).electron?.storeSet) {
      await (window as any).electron.storeSet('user', user);
    }
  }
  window.dispatchEvent(new Event('sync-auth-event'));
};

export const clearAuthTokens = async () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('local_tts_key');
  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
  
  if ((window as any).electron?.storeDelete) {
    await (window as any).electron.storeDelete('accessToken');
    await (window as any).electron.storeDelete('refreshToken');
    await (window as any).electron.storeDelete('user');
  }
  
  window.dispatchEvent(new Event('sync-auth-event'));
};
