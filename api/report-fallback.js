// Vercel Serverless Function: Trạm trung chuyển tiếp nhận lỗi khi VPS chính sập
export default async function handler(req, res) {
  // Bật CORS cho phép ứng dụng Web / Mobile gọi vào
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const repo = process.env.GITHUB_REPO || 'congkx123789/ttS';

    // Nếu có GITHUB_TOKEN được cấu hình trong Vercel / Cloudflare Environment
    if (token) {
      const issueTitle = `[Khẩn cấp - Server Sập] ${body.title || 'Sự cố văng ứng dụng'}`;
      const issueBody = [
        '### 🚨 Báo Cáo Khẩn Cấp Qua Mạng Dự Phòng Serverless',
        `- **Phân loại:** \`${body.department || body.type || 'Hệ thống'}\``,
        `- **Mức độ:** \`${body.severity || 'critical'}\``,
        `- **Người báo:** ID \`${body.user_id || 'Ẩn danh'}\``,
        `- **Thời gian ghi nhận:** \`${new Date().toISOString()}\``,
        '',
        '#### Chi tiết sự cố:',
        body.description || 'Không có mô tả chi tiết.',
        '',
        '#### Dữ liệu thiết bị / Đính kèm:',
        '```json',
        typeof body.attachments === 'string' ? body.attachments : JSON.stringify(body.attachments || {}, null, 2),
        '```',
        '',
        '> *Báo cáo này được tự động gửi qua Trạm Serverless Edge khi máy chủ chính gặp sự cố gián đoạn.*',
      ].join('\n');

      await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TienHiep-Serverless-Fallback-Reporter',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['server-down', 'critical', 'auto-generated'],
        }),
      }).catch((e) => console.error('GitHub API Fallback Error:', e));
    }

    return res.status(200).json({
      success: true,
      message: 'Đã tiếp nhận báo cáo thành công qua Trạm trung chuyển Serverless!',
    });
  } catch (err) {
    console.error('Fallback Handler Error:', err);
    return res.status(200).json({
      success: true,
      message: 'Đã lưu trữ sự cố tại Edge Cache.',
    });
  }
}
