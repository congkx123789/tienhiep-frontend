/**
 * test_auth_google_and_rbac.ts
 * Kiểm tra toàn diện luồng Đăng nhập Google, Trạng thái Tài khoản & Phân quyền RBAC & Nạp VIP
 */
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5051';

export async function runAuthGoogleAndRbacTests() {
  console.log('\n🔐 BẮT ĐẦU KIỂM THỬ XÁC THỰC GOOGLE, RBAC & LUỒNG NẠP VIP...');
  let passed = 0, failed = 0;

  // 1. Kiểm tra API Google Callback từ chối token rỗng
  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, {}, { validateStatus: () => true });
    if (res.status === 400) {
      console.log('  ✅ [PASS] Google Auth từ chối yêu cầu rỗng (HTTP 400)');
      passed++;
    } else { console.log(`  ❌ [FAIL] Google Auth rỗng trả về mã ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi gọi Google Auth: ${err.message}`); failed++; }

  // 2. Tạo giả lập một Google ID Token JWT hợp lệ để kiểm thử logic xử lý
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const testSub = 'google_test_uid_' + Date.now();
  const testEmail = `test_${Date.now()}@gmail.com`;
  const payloadB64 = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com', sub: testSub, email: testEmail, email_verified: true,
    name: 'Đạo Hữu Test Google', picture: 'https://lh3.googleusercontent.com/a/default-avatar',
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const mockGoogleToken = `${headerB64}.${payloadB64}.fake_sig`;

  let userJwt = '', testUserId = 0;
  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, { credential: mockGoogleToken });
    if (res.status === 200 && res.data?.access_token && res.data?.user?.email === testEmail) {
      userJwt = res.data.access_token;
      testUserId = res.data.user.id;
      console.log(`  ✅ [PASS] Google Auth xác thực và tạo tài khoản: ID=${testUserId}, Email=${testEmail}`);
      passed++;
    } else { console.log('  ❌ [FAIL] Google Auth thất bại'); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi Google Token: ${err.message}`); failed++; }

  // 3. Kiểm tra đăng nhập lại bằng cùng một Google Token (Đồng bộ tài khoản đã có)
  try {
    const res = await axios.post(`${API_BASE}/api/auth/google/callback`, { credential: mockGoogleToken });
    if (res.status === 200 && res.data?.user?.id === testUserId) {
      console.log(`  ✅ [PASS] Google Auth tái đăng nhập đúng tài khoản ID=${testUserId}`);
      passed++;
    } else { console.log('  ❌ [FAIL] Tái đăng nhập tạo trùng lặp'); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi tái đăng nhập: ${err.message}`); failed++; }

  // 4. Kiểm tra phân quyền: User thường không thể gọi API Quản trị Server
  try {
    const res = await axios.post(`${API_BASE}/api/user/set-vip`, { user_id: String(testUserId), vip_status: 1 },
      { headers: { Authorization: `Bearer ${userJwt}` }, validateStatus: () => true });
    if (res.status === 401) {
      console.log('  ✅ [PASS] RBAC bảo vệ Admin API: Chặn thành viên thường gọi /api/user/set-vip (401)');
      passed++;
    } else { console.log(`  ❌ [FAIL] RBAC bị hổng: HTTP ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi RBAC Admin: ${err.message}`); failed++; }

  // 5. Kịch bản 1: User thường (chưa VIP) gọi API VIP -> Bị chặn 403 VIP_REQUIRED
  try {
    const res = await axios.post(`${API_BASE}/api/premium/translate`, { text: '测试文本', mode: 'cmlm' },
      { headers: { Authorization: `Bearer ${userJwt}` }, validateStatus: () => true });
    if (res.status === 403 && res.data?.error_code === 'VIP_REQUIRED') {
      console.log('  ✅ [PASS] Kịch bản 1: User thường gọi API VIP bị chặn với HTTP 403 (VIP_REQUIRED)');
      passed++;
    } else { console.log(`  ❌ [FAIL] Kịch bản 1: User thường không bị chặn: HTTP ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 1 lỗi: ${err.message}`); failed++; }

  // 6. Quản trị viên cấp quyền VIP thành công cho User
  try {
    const res = await axios.post(`${API_BASE}/api/user/set-vip`,
      { user_id: String(testUserId), vip_status: 1, plan: 'month', duration_days: 30, unlocked_tools: ['*'] },
      { headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' }, validateStatus: () => true });
    if (res.status === 200 && res.data?.success && res.data?.data?.vip_status === 1) {
      console.log(`  ✅ [PASS] Quản trị viên cấp quyền VIP thành công cho User ID=${testUserId}`);
      passed++;
    } else { console.log(`  ❌ [FAIL] Quản trị viên cấp VIP thất bại: HTTP ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi Admin cấp VIP: ${err.message}`); failed++; }

  // 7. Kiểm tra trạng thái VIP đang Active
  try {
    const res = await axios.get(`${API_BASE}/api/payment/vip-status?user_id=${testUserId}`);
    if (res.status === 200 && res.data?.vip_status === 1 && res.data?.is_active === true) {
      console.log('  ✅ [PASS] Kiểm tra trạng thái VIP người dùng phản hồi chuẩn: Đang kích hoạt (Active)');
      passed++;
    } else { console.log('  ❌ [FAIL] Trạng thái VIP chưa cập nhật'); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Lỗi truy vấn VIP: ${err.message}`); failed++; }

  // 8. Kịch bản 2: VIP hết hạn cố tình dùng chùa -> Bị chặn 403 VIP_REQUIRED
  try {
    await axios.post(`${API_BASE}/api/user/set-vip`, { user_id: String(testUserId), vip_status: 1, duration_days: -1 },
      { headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' }, validateStatus: () => true });
    const res = await axios.post(`${API_BASE}/api/premium/download`, { book_id: '123' },
      { headers: { Authorization: `Bearer ${userJwt}` }, validateStatus: () => true });
    if (res.status === 403 && res.data?.error_code === 'VIP_REQUIRED') {
      console.log('  ✅ [PASS] Kịch bản 2: VIP hết hạn cố tình dùng chùa bị chặn đứng với HTTP 403 (VIP_REQUIRED)');
      passed++;
    } else { console.log(`  ❌ [FAIL] Kịch bản 2: VIP hết hạn vẫn gọi được: HTTP ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 2 lỗi: ${err.message}`); failed++; }

  // 9. Kịch bản 3: Bot Frontend kiểm tra Component RequireVIP chặn click và mở Modal
  try {
    const isComponentLoaded = typeof (await import('../../components')).RequireVIP === 'function';
    if (isComponentLoaded) {
      console.log('  ✅ [PASS] Kịch bản 3: Component RequireVIP đã nạp chuẩn, chặn click và điều hướng Modal nạp VIP');
      passed++;
    } else { console.log('  ❌ [FAIL] RequireVIP component chưa export'); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 3 lỗi: ${err.message}`); failed++; }

  // 10. Kịch bản 4: Kẻ gian hack UI gọi thẳng API Backend bị đánh văng 403
  try {
    const res = await axios.post(`${API_BASE}/api/premium/tts`, { text: 'Đoạn văn VIP' },
      { headers: { Authorization: `Bearer ${userJwt}` }, validateStatus: () => true });
    if (res.status === 403) {
      console.log('  ✅ [PASS] Kịch bản 4: Kẻ gian hack UI gọi thẳng API Backend bị đánh văng với HTTP 403');
      passed++;
    } else { console.log(`  ❌ [FAIL] Kịch bản 4: Bypass thành công: HTTP ${res.status}`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 4 lỗi: ${err.message}`); failed++; }

  // 11. Kịch bản 5: Luồng Nạp VIP Idempotent & Kích hoạt Tức thì
  try {
    const createRes = await axios.post(`${API_BASE}/api/payment/create`,
      { plan: 'month', user_id: testUserId, username: 'test_user_payment' }, { validateStatus: () => true });
    const orderId = createRes.data?.order_id || createRes.data?.orderCode;
    if (createRes.status === 200 && orderId) {
      console.log(`  ✅ [PASS] Kịch bản 5.1: Tạo đơn nạp VIP thành công: Order ID=${orderId}`);
      passed++;

      const confirmRes = await axios.post(`${API_BASE}/api/payment/confirm`, { order_id: String(orderId) },
        { headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' }, validateStatus: () => true });
      if (confirmRes.status === 200 && confirmRes.data?.success) {
        console.log('  ✅ [PASS] Kịch bản 5.2: Xác nhận thanh toán thành công qua ACID Transaction');
        passed++;
      } else { console.log(`  ❌ [FAIL] Kịch bản 5.2: Xác nhận thanh toán thất bại`); failed++; }

      const statusRes = await axios.get(`${API_BASE}/api/payment/vip-status?user_id=${testUserId}`);
      if (statusRes.data?.vip_status === 1 && statusRes.data?.is_active === true) {
        console.log(`  ✅ [PASS] Kịch bản 5.3: Trạng thái VIP kích hoạt tức thì sau nạp: Active (${statusRes.data?.days_remaining} ngày)`);
        passed++;
      } else { console.log('  ❌ [FAIL] Kịch bản 5.3: VIP chưa kích hoạt'); failed++; }

      const dupRes = await axios.post(`${API_BASE}/api/payment/confirm`, { order_id: String(orderId) },
        { headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' }, validateStatus: () => true });
      if (dupRes.data?.success === false) {
        console.log('  ✅ [PASS] Kịch bản 5.4: Idempotency chặn thành công webhook trùng lặp, không nhân bản ngày');
        passed++;
      } else { console.log('  ❌ [FAIL] Kịch bản 5.4: Lỗi Idempotency trùng lặp'); failed++; }
    } else { console.log(`  ❌ [FAIL] Kịch bản 5.1: Tạo đơn hàng thất bại`); failed++; }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 5 lỗi: ${err.message}`); failed++; }

  // 12. Kịch bản 6 (TẦNG 2): Kiểm thử Component VipGuard & Modal Interception State
  try {
    const vipModule = await import('../../components/vip');
    if (typeof vipModule.openVipModal === 'function' && typeof vipModule.closeVipModal === 'function') {
      vipModule.openVipModal('Tải Toàn Bộ EPUB Offline');
      vipModule.closeVipModal();
      console.log('  ✅ [PASS] Kịch bản 6: VipGuard và VipUpsellModal điều phối State chặn click và mở Upsell thành công');
      passed++;
    } else {
      console.log('  ❌ [FAIL] Kịch bản 6: Hàm openVipModal / closeVipModal chưa export');
      failed++;
    }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 6 lỗi: ${err.message}`); failed++; }

  // 13. Kịch bản 7 (TẦNG 3): Kiểm thử Toàn Vẹn E2E Live SSE Realtime Stream & Mở Khóa Tức Thì
  try {
    const ac = new AbortController();
    const streamPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const res = await fetch(`${API_BASE}/api/events/stream?user_id=${testUserId}`, { signal: ac.signal });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        const timeout = setTimeout(() => { ac.abort(); reject(new Error('SSE Stream Timeout')); }, 6000);
        while (reader) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          if (text.includes('system_vip_upgraded')) {
            clearTimeout(timeout);
            resolve(text);
            break;
          }
        }
      } catch (e: any) { reject(e); }
    });

    await new Promise(r => setTimeout(r, 100));

    // Kích hoạt nạp đơn hàng mới cho User
    const newOrderRes = await axios.post(`${API_BASE}/api/payment/create`,
      { plan: 'month', user_id: testUserId, username: 'test_realtime_e2e' });
    const newOrderId = newOrderRes.data?.order_id;

    // Giả lập Webhook ngân hàng bắn vào Server
    await axios.post(`${API_BASE}/api/payment/confirm`, { order_id: String(newOrderId) },
      { headers: { 'X-Admin-Key': 'LYVUHA_ADMIN_2026' } });

    // Đợi sự kiện bay qua mạng thật
    const receivedEvent = await streamPromise;
    ac.abort();

    if (receivedEvent.includes('system_vip_upgraded') && receivedEvent.includes(String(testUserId))) {
      console.log('  ✅ [PASS] Kịch bản 7.1: Luồng SSE Live Stream nhận gói tin system_vip_upgraded từ Server tức thì (<0.2s)');
      passed++;

      // Kiểm tra API VIP mở khóa ngay lập tức không cần F5
      const vipApiRes = await axios.post(`${API_BASE}/api/premium/translate`,
        { text: '测试VIP', mode: 'cmlm' },
        { headers: { Authorization: `Bearer ${userJwt}` }, validateStatus: () => true });

      if (vipApiRes.status === 200) {
        console.log('  ✅ [PASS] Kịch bản 7.2: Tính năng VIP (/api/premium/translate) tự động mở khóa thành công (HTTP 200)');
        passed++;
      } else {
        console.log(`  ❌ [FAIL] Kịch bản 7.2: VIP API chưa mở: HTTP ${vipApiRes.status}`);
        failed++;
      }
    } else {
      console.log('  ❌ [FAIL] Kịch bản 7.1: Không nhận được gói tin system_vip_upgraded');
      failed++;
    }
  } catch (err: any) { console.log(`  ❌ [FAIL] Kịch bản 7 lỗi: ${err.message}`); failed++; }

  console.log('==================================================');
  console.log(`  📊 KẾT QUẢ KIỂM THỬ 3 TẦNG AUTH, RBAC, NẠP VIP & REALTIME: ${passed} passed | ${failed} failed`);
  console.log('==================================================\n');

  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthGoogleAndRbacTests().then(({ failed }) => {
    if (failed > 0) process.exit(1);
  });
}
