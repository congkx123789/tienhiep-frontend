import { test, expect } from '@playwright/test';

async function getAdminToken(request: any) {
  for (const host of ['http://127.0.0.1:5051', 'https://cong123779-tienhiep-api.hf.space']) {
    try {
      const res = await request.post(`${host}/api/auth/login`, {
        data: { username: 'admin', password: 'Admin@2026' },
        timeout: 2500,
      });
      if (res.ok()) return await res.json();
    } catch {}
  }
  return {
    access_token: 'mock_super_admin_jwt_token',
    user: { id: 1, username: 'admin', role: 'admin', tier: 'VIP3' },
  };
}

test.describe('Monkey Bot: Kiểm thử hỗn loạn (Chaos Testing) chống văng lỗi', () => {

  test('Bot khỉ tự do click ngẫu nhiên 50 lần trên trang chủ và các thanh điều hướng', async ({ page }) => {

    const unhandledErrors: string[] = [];
    page.on('pageerror', (err) => {
      // Bắt các unhandled error nghiêm trọng
      unhandledErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Chạy vòng lặp 50 lần click ngẫu nhiên
    for (let i = 0; i < 50; i++) {
      const clickables = page.locator('button:visible, a:visible, [role="button"]:visible');
      const count = await clickables.count();

      if (count > 0) {
        const randomIndex = Math.floor(Math.random() * count);
        const target = clickables.nth(randomIndex);
        try {
          await target.click({ timeout: 400, force: true });
          // Nghỉ cực ngắn giả lập tương tác người dùng
          await page.waitForTimeout(50);
        } catch {
          // Bỏ qua nếu element bị ẩn hoặc unmounted giữa chừng
        }
      }
    }

    // Đảm bảo không văng màn hình trắng / Error Boundary
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
    
    // Đảm bảo không có unhandled syntax / null reference crash
    const fatalErrors = unhandledErrors.filter(
      msg => !msg.includes('ResizeObserver') && !msg.includes('Failed to fetch')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('Bot khỉ click ngẫu nhiên 40 lần trên trang Cài đặt & Hộp thư', async ({ page, request }) => {
    // Đăng nhập để bot có thể tương tác đầy đủ các form
    const loginData = await getAdminToken(request);

    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }, loginData);

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    for (let i = 0; i < 40; i++) {
      const clickables = page.locator('button:visible, a:visible, input[type="checkbox"]:visible');
      const count = await clickables.count();
      if (count > 0) {
        const randomIndex = Math.floor(Math.random() * count);
        const target = clickables.nth(randomIndex);
        try {
          await target.click({ timeout: 400, force: true });
          await page.waitForTimeout(50);
        } catch {
          // ignore transient state
        }
      }
    }

    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });
});
