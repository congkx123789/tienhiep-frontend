import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

export interface SwipeGestureHandlers {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  enabled?: boolean;
}

/**
 * Hook xử lý cử chỉ vuốt chuyển chương khi đọc truyện (Swipe Navigation):
 * - Vuốt ngang sang trái (Swipe Left) -> Chuyển chương tiếp theo
 * - Vuốt ngang sang phải (Swipe Right) -> Về chương trước
 * - Bảo lưu cạnh mép trái iOS (0 - 30px) cho cử chỉ Back của hệ thống
 * - Bỏ qua nếu là vuốt dọc (để người dùng cuộn đọc truyện tự nhiên)
 */
export function useReaderSwipeGesture({
  onNextChapter,
  onPrevChapter,
  enabled = true
}: SwipeGestureHandlers) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const isIOS = Capacitor.getPlatform() === 'ios' || /iphone|ipad|ipod/i.test(navigator.userAgent);

    const handleTouchStart = (e: TouchEvent) => {
      // Chỉ nhận diện chạm 1 ngón
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;
      touchStartRef.current = null;

      const duration = Date.now() - start.time;
      if (duration > 700) return; // Quá chậm (>700ms) không phải thao tác vuốt lướt

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      // Không can thiệp nếu người dùng đang bôi đen chữ
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) return;

      // Bảo lưu cạnh trái trên iOS (0 - 30px) cho cử chỉ Back của iOS
      if (isIOS && start.x <= 30 && deltaX > 30) {
        return;
      }

      // Vuốt dọc để cuộn nội dung đọc -> Bỏ qua tuyệt đối, không lật chương nhầm
      if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaY) > 50) {
        return;
      }

      // Ngưỡng vuốt ngang lật trang tối thiểu: 55px và góc ngang rõ rệt
      const SWIPE_THRESHOLD = 55;
      if (Math.abs(deltaX) >= SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          // Vuốt sang trái -> Chương kế tiếp
          onNextChapter?.();
        } else {
          // Vuốt sang phải -> Chương trước đó
          onPrevChapter?.();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onNextChapter, onPrevChapter, enabled]);
}
