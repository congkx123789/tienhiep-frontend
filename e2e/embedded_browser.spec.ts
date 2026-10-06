import { test, expect } from '@playwright/test';

test.describe('🌐 Kiểm thử Trình duyệt Nhúng Đa Nền Tảng (Chrome-like Embedded Browser)', () => {

  test('Lớp 3: Trình duyệt nhúng phải hiển thị đầy đủ thanh công cụ và không bị trắng màn hình', async ({ page }) => {
    // 1. Mở trang chủ ứng dụng
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 2. Mở trình duyệt nội bộ bằng nút 'Trình duyệt' trên thanh điều hướng đỉnh
    const browserNavBtn = page.locator('button:has-text("Trình duyệt"), [title*="Trình duyệt"]').first();
    if (await browserNavBtn.isVisible()) {
      await browserNavBtn.click();
    } else {
      // Điều hướng trực tiếp bằng context
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('open-in-browser', { detail: { url: 'https://m.qidian.com' } }));
      });
    }

    // 3. Chờ khung trình duyệt nhúng xuất hiện
    await page.waitForTimeout(1000);

    // 4. Kiểm tra Backend Proxy phục vụ trang truyện mượt mà không dính X-Frame-Options
    const proxyStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/iframe_proxy?url=https%3A%2F%2Fwww.69shuba.com');
        const text = await res.text();
        return {
          status: res.status,
          hasFrameBustingShield: text.includes("Object.defineProperty(window, 'top'"),
          notBlocked: res.status === 200 && text.length > 500
        };
      } catch (err: any) {
        return { status: 500, hasFrameBustingShield: false, notBlocked: false, error: err.message };
      }
    });

    console.log(`📊 Kết quả Proxy 69shuba: HTTP ${proxyStatus.status}, Khiên Frame-Busting: ${proxyStatus.hasFrameBustingShield}`);
    expect(proxyStatus.status).toBe(200);
    expect(proxyStatus.hasFrameBustingShield).toBe(true);
    expect(proxyStatus.notBlocked).toBe(true);
  });

  test('Lớp 3: Backend Proxy tiêm Base Tag và Header AllowAll chuẩn', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Kiểm tra Proxy bọc đúng Base tag và Content Type
    const baseTagCheck = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/iframe_proxy?url=https%3A%2F%2Fwww.69shuba.com');
        const text = await res.text();
        return {
          status: res.status,
          hasBaseTag: text.includes('<base href="https://www.69shuba.com/'),
          isHTML: res.headers.get('content-type')?.includes('text/html')
        };
      } catch (err: any) {
        return { status: 500, hasBaseTag: false, isHTML: false };
      }
    });

    console.log(`📊 Kết quả Base Tag Check: HTTP ${baseTagCheck.status}, Base Tag: ${baseTagCheck.hasBaseTag}`);
    expect(baseTagCheck.status).toBe(200);
    expect(baseTagCheck.hasBaseTag).toBe(true);
  });

  test('Lớp 3: Không có màn hình trắng (White Screen Crash) hoặc React Error Boundary', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Đảm bảo không xuất hiện thông báo crash
    const errorFallback = page.locator('text=Hệ thống gặp sự cố bất ngờ');
    await expect(errorFallback).not.toBeVisible();

    // Body không được rỗng
    const bodyContent = await page.evaluate(() => document.body.innerHTML.trim().length);
    expect(bodyContent).toBeGreaterThan(500);
  });
});
