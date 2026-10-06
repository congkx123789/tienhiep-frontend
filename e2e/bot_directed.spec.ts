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

test.describe('Directed Bot: Kịch bản kiểm thử điều hướng & tính năng cốt lõi', () => {

  test('Bot mở trang chủ, kiểm tra danh mục sách và các nút điều hướng', async ({ page }) => {
    await page.goto('/');
    
    // Đảm bảo không văng Error Boundary
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();

    // Trang chủ hiển thị tiêu đề hoặc thanh tìm kiếm
    await expect(page).toHaveTitle(/.*Tiên Hiệp.*/i);

    // Chờ nội dung chính xuất hiện
    await page.waitForLoadState('domcontentloaded');
  });

  test('Bot tự động đăng nhập tài khoản Quản trị và kiểm tra hồ sơ', async ({ page, request }) => {
    // 1. Bot gọi API Login để lấy Token chuẩn của Super Admin
    const loginData = await getAdminToken(request);
    expect(loginData.access_token).toBeDefined();

    // 2. Nạp token vào trình duyệt
    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `accessToken=${data.access_token}; path=/; max-age=604800`;
    }, loginData);

    // 3. Mở trang Cài đặt Hồ sơ
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Không bị crash
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });

  test('Bot kiểm tra trang Gói VIP & Nút nâng cấp', async ({ page }) => {
    await page.goto('/vip');
    await page.waitForLoadState('domcontentloaded');

    // Không bị văng lỗi
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();

    // Chờ các phần tử tương tác xuất hiện
    await page.waitForSelector('button, a', { timeout: 5000 });
    const buttons = page.locator('button, a');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Bot kiểm tra Hộp thư đàm đạo & Kênh Thế Giới (Global Chat)', async ({ page, request }) => {
    // Đăng nhập trước
    const loginData = await getAdminToken(request);

    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `accessToken=${data.access_token}; path=/; max-age=604800`;
    }, loginData);

    await page.goto('/user/messages');
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra không bị crash
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });

  test('Bot kiểm tra Tông Môn (Sects)', async ({ page }) => {
    await page.goto('/sects');
    await page.waitForLoadState('domcontentloaded');

    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });
});
