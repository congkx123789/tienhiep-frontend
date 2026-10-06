import { useState, useEffect } from 'react';

interface VipModalState {
  isOpen: boolean;
  featureName: string;
}

let modalState: VipModalState = {
  isOpen: false,
  featureName: 'Tính năng đặc quyền VIP',
};

const listeners = new Set<(state: VipModalState) => void>();

export const openVipModal = (featureName = 'Tính năng đặc quyền VIP') => {
  modalState = { isOpen: true, featureName };
  listeners.forEach((fn) => fn(modalState));
};

export const closeVipModal = () => {
  modalState = { ...modalState, isOpen: false };
  listeners.forEach((fn) => fn(modalState));
};

export function useVipModalStore() {
  const [state, setState] = useState<VipModalState>(modalState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    isOpen: state.isOpen,
    featureName: state.featureName,
    openVipModal,
    closeVipModal,
  };
}
