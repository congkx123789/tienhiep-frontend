import { useState, useEffect, useRef } from 'react';
import { PositionState } from './AudioPlayer.types';

export function useDraggablePlayer(_isMinimized?: boolean, _showSettings?: boolean) {
  const playerElRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<PositionState | null>(null);
  const [position, setPosition] = useState<PositionState | null>(null);
  const draggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const playerOffset = useRef({ x: 0, y: 0 });
  const playerSize = useRef({ width: 290, height: 145 });

  const startDrag = (clientX: number, clientY: number) => {
    const el = playerElRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    playerSize.current = { width: rect.width, height: rect.height };
    playerOffset.current = { 
      x: rect.left, 
      y: window.innerHeight - rect.bottom 
    };
    dragStart.current = { x: clientX, y: clientY };
    isDraggingRef.current = true;
    draggedRef.current = false;
    el.style.transition = 'none';
    document.body.classList.add('global-dragging');
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) draggedRef.current = true;

    const rawLeft = playerOffset.current.x + dx;
    const rawBottom = playerOffset.current.y - dy;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const minBottom = isMobile ? 76 : 16;

    const newLeft = Math.max(10, Math.min(rawLeft, window.innerWidth - playerSize.current.width - 10));
    const maxBottom = Math.max(minBottom, window.innerHeight - playerSize.current.height - 56);
    const newBottom = Math.max(minBottom, Math.min(rawBottom, maxBottom));

    setPosition({ x: newLeft, y: newBottom });
    positionRef.current = { x: newLeft, y: newBottom };

    const clampLeftDiff = rawLeft - newLeft;
    const clampBottomDiff = rawBottom - newBottom;
    if (clampLeftDiff !== 0) dragStart.current.x += clampLeftDiff;
    if (clampBottomDiff !== 0) dragStart.current.y -= clampBottomDiff;
  };

  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    document.body.classList.remove('global-dragging');
    const pos = positionRef.current;
    if (pos && draggedRef.current) {
      try {
        localStorage.setItem('audio_player_pos_v4', JSON.stringify(pos));
      } catch {}
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('.no-drag')) return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('.no-drag')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); };
    const onUp = () => endDrag();

    const handleWindowResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const minBottom = isMobile ? 76 : 16;
        const maxLeft = Math.max(10, window.innerWidth - playerSize.current.width - 10);
        const maxBottom = Math.max(minBottom, window.innerHeight - playerSize.current.height - 56);
        const newLeft = Math.max(10, Math.min(prev.x, maxLeft));
        const newBottom = Math.max(minBottom, Math.min(prev.y, maxBottom));
        if (newLeft !== prev.x || newBottom !== prev.y) {
          positionRef.current = { x: newLeft, y: newBottom };
          return { x: newLeft, y: newBottom };
        }
        return prev;
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('resize', handleWindowResize);
      document.body.classList.remove('global-dragging');
    };
  }, []);

  const dragStyle: React.CSSProperties = position
    ? { left: `${position.x}px`, bottom: `${position.y}px`, right: 'auto' }
    : {};

  return {
    playerElRef,
    position,
    setPosition,
    dragStyle,
    draggedRef,
    handleMouseDown,
    handleTouchStart
  };
}
