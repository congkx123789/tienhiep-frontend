// Micro-service quản lý hộp thoại xác nhận toàn cục (Promise-based Confirm Dialog)
export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

type DialogListener = (state: ConfirmState | null) => void;

export interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

let activeListener: DialogListener | null = null;

export const registerDialogListener = (listener: DialogListener) => {
  activeListener = listener;
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
};

/**
 * appConfirm: Thay thế window.confirm() mặc định.
 * Trả về một Promise<boolean>, không khóa luồng JavaScript, giao diện Tiên Hiệp đồng bộ.
 */
export const appConfirm = (options: string | ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    const opts: ConfirmOptions = typeof options === 'string'
      ? { message: options }
      : options;

    if (!activeListener) {
      // Fallback an toàn nếu Modal chưa kịp mount (ví dụ SSR hoặc test)
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const result = window.confirm(opts.message);
        resolve(result);
        return;
      }
      resolve(true);
      return;
    }

    activeListener({
      title: opts.title || (opts.type === 'danger' ? 'Xác Nhận Thao Tác' : 'Thông Báo'),
      message: opts.message,
      confirmText: opts.confirmText || 'Đồng ý',
      cancelText: opts.cancelText || 'Hủy bỏ',
      type: opts.type || 'danger',
      resolve: (choice: boolean) => {
        if (activeListener) activeListener(null);
        resolve(choice);
      },
    });
  });
};
