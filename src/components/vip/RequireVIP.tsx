import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVipGate } from '../../contexts/VipGateContext';

interface RequireVIPProps {
  children: React.ReactNode;
  toolId?: string;
  toolName?: string;
  description?: string;
  className?: string;
  fallbackAction?: () => void;
}

/**
 * Component bọc ngoài các nút bấm hoặc tính năng VIP đạt chuẩn Enterprise
 * Tự động chặn click của Tài khoản thường và bật Modal mở khóa VIP
 */
export const RequireVIP: React.FC<RequireVIPProps> = ({
  children,
  toolId = 'premium_feature',
  toolName = 'Đặc Quyền VIP',
  description = 'Đạo hữu cần nâng cấp VIP để sử dụng tính năng Đọc Truyện Offline và Dịch AI CMLM.',
  className = '',
  fallbackAction,
}) => {
  const { user } = useAuth();
  const { isToolUnlocked, openToolGate, openVipModal } = useVipGate();

  // Kiểm tra thời hạn VIP đối chiếu thời gian thực
  const isVipValid = React.useMemo(() => {
    if (!user) return false;
    const username = (user.username || '').toLowerCase();
    if (['admin', 'havucong25', 'congkx123789'].includes(username)) return true;
    if (user.vip_status === 1) {
      if (!user.vip_expiry || user.vip_expiry === 'lifetime') return true;
      const expDate = new Date(user.vip_expiry);
      return !isNaN(expDate.getTime()) && expDate.getTime() > Date.now();
    }
    return isToolUnlocked(toolId);
  }, [user, isToolUnlocked, toolId]);

  const handleInterceptClick = (e: React.MouseEvent) => {
    if (!isVipValid) {
      e.preventDefault();
      e.stopPropagation();

      if (typeof fallbackAction === 'function') {
        fallbackAction();
        return;
      }

      if (toolId) {
        openToolGate(toolId, toolName, description);
      } else {
        openVipModal();
      }
    }
  };

  return (
    <div
      onClickCapture={handleInterceptClick}
      className={`relative inline-block ${!isVipValid ? 'opacity-70 cursor-not-allowed select-none' : ''} ${className}`}
    >
      {children}
      {!isVipValid && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-amber-500 text-black rounded px-1 py-0.2 shadow pointer-events-none uppercase">
          VIP
        </span>
      )}
    </div>
  );
};

export default RequireVIP;
