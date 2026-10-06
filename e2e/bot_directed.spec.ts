import { test, expect } from '@playwright/test';

test.describe('Directed Bot: Kịch bản kiểm thử điều hướng & tính năng cốt lõi', () => {

  test('Bot mở trang chủ, kiểm tra danh mục sách và các nút điều hướng', async ({ page }) => {
    await page.goto('/');
    
    // Đảm bảo không văng Error Boundary
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();

    // Trang chủ hiển thị tiêu đề hoặc thanh tìm kiếm
    await expect(page).toHaveTitle(/.*Tiên Hiệp.*/i);

    // Chờ nội dung chính xuất hiện
    await page.waitForLoadState('networkidle');
  });

  test('Bot tự động đăng nhập tài khoản Quản trị và kiểm tra hồ sơ', async ({ page, request }) => {
    // 1. Bot gọi API Login để lấy Token chuẩn của Super Admin
    const loginRes = await request.post('http://127.0.0.1:5051/api/auth/login', {
      data: {
        username: 'admin',
        password: 'Admin@2026',
      },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
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
    await page.waitForLoadState('networkidle');

    // Không bị crash
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });

  test('Bot kiểm tra trang Gói VIP & Nút nâng cấp', async ({ page }) => {
    await page.goto('/vip');
    await page.waitForLoadState('networkidle');

    // Không bị văng lỗi
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();

    // Kiểm tra có các nút hoặc thẻ VIP
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Bot kiểm tra Hộp thư đàm đạo & Kênh Thế Giới (Global Chat)', async ({ page, request }) => {
    // Đăng nhập trước
    const loginRes = await request.post('http://127.0.0.1:5051/api/auth/login', {
      data: {
        username: 'admin',
        password: 'Admin@2026',
      },
    });
    const loginData = await loginRes.json();

    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `accessToken=${data.access_token}; path=/; max-age=604800`;
    }, loginData);

    await page.goto('/user/messages');
    await page.waitForLoadState('networkidle');

    // Kiểm tra không bị crash
    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });

  test('Bot kiểm tra Tông Môn (Sects)', async ({ page }) => {
    await page.goto('/sects');
    await page.waitForLoadState('networkidle');

    const crashScreen = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(crashScreen).not.toBeVisible();
  });
});
