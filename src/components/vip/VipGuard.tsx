import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVipModalStore } from './useVipModalStore';

interface VipGuardProps {
  children: React.ReactNode;
  featureName?: string;
  fallbackAction?: () => void;
  className?: string;
}

export const VipGuard: React.FC<VipGuardProps> = ({
  children,
  featureName = 'Tính năng đặc quyền VIP',
  fallbackAction,
  className = '',
}) => {
  const { user } = useAuth();
  const { openVipModal } = useVipModalStore();

  const isVip = Boolean(
    user?.isVip ||
    (user?.vip_status === 1 && (!user?.vip_expiry || new Date(user.vip_expiry) > new Date())) ||
    user?.role === 'admin'
  );

  const handleIntercept = (e: React.MouseEvent) => {
    if (!isVip) {
      e.preventDefault();
      e.stopPropagation();
      if (fallbackAction) {
        fallbackAction();
      } else {
        openVipModal(featureName);
      }
    }
  };

  return (
    <div onClickCapture={handleIntercept} className={`relative inline-block group ${className}`}>
      <div className={!isVip ? 'opacity-80 transition-opacity group-hover:opacity-100 cursor-pointer' : ''}>
        {children}
      </div>
      {!isVip && (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg z-10 pointer-events-none tracking-wider">
          VIP
        </span>
      )}
    </div>
  );
};
