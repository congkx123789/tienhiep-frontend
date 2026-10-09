import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/alida/.gemini/antigravity-ide/brain/07ed18d7-a513-4fba-b549-8c686c5371c5';

test.describe('📸 Kiểm thử Toàn bộ Giao diện, Nút bấm & Chụp ảnh Chi tiết', () => {

  test('1. Kiểm thử Trang Tìm truyện, Nút bấm Điều hướng & Tủ sách', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Chụp ảnh Trang Chủ / Khám phá
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_app_discover_search.png'), fullPage: false });
    console.log('📸 Đã lưu: 01_app_discover_search.png');

    // Nhập từ khóa tìm kiếm vào ô Search
    const searchInput = page.locator('input[placeholder*="Tìm"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Phàm Nhân');
      await page.waitForTimeout(500);
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_app_search_results.png'), fullPage: false });
      console.log('📸 Đã lưu: 02_app_search_results.png');
    }
  });

  test('2. Kiểm thử Trình duyệt Web, Nút URL, Nút Dịch & Thanh TTS', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });

    // Khởi tạo biến giả lập Native/Electron để kích hoạt BrowserHeader & BrowserOverlay
    await page.addInitScript(() => {
      (window as any).electron = { isDesktop: true };
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Kích hoạt mở tab với URL truyện để hiển thị đầy đủ BrowserHeader, URL bar, Nút Dịch và TTS
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-in-browser', {
        detail: { url: 'https://m.69shuba.cx/txt/123/456.htm' }
      }));
    });
    await page.waitForTimeout(1200);

    // Chụp ảnh Trình duyệt với thanh công cụ điều khiển URL + Dịch + TTS
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_browser_url_translate_tts.png'), fullPage: false });
    console.log('📸 Đã lưu: 03_browser_url_translate_tts.png');
  });

  test('3. Kiểm thử Giao diện Web Đọc Local & Đọc Chương', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto('/embed', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // Chụp ảnh giao diện đọc sách Local
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_local_reader_interface.png'), fullPage: false });
    console.log('📸 Đã lưu: 04_local_reader_interface.png');

    // Chụp thêm giao diện Đọc chương truyện trực tiếp
    await page.goto('/book/1/read/0', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_reader_chapter_view.png'), fullPage: false });
    console.log('📸 Đã lưu: 06_reader_chapter_view.png');
  });

  test('4. Kiểm thử Chế độ Điện thoại (Mobile Responsive & App View)', async ({ page }) => {
    // Kích thước chuẩn iPhone / Android: 390 x 844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Chụp ảnh giao diện Mobile
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_mobile_app_view.png'), fullPage: false });
    console.log('📸 Đã lưu: 05_mobile_app_view.png');
  });

});
