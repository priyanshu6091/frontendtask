import { useCallback, useRef, useState } from 'react';
import type { TouchGesture } from '../types';

interface TouchGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (gesture: TouchGesture) => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  pinchThreshold?: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeRight,
    onSwipeLeft,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    pinchThreshold = 10
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const pinchDistanceRef = useRef<number | null>(null);

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    setIsLongPress(false);

    // Handle pinch gesture
    if (e.touches.length === 2) {
      pinchDistanceRef.current = getTouchDistance(e.touches);
    }

    // Set up long press detection
    if (onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        setIsLongPress(true);
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel long press if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && pinchDistanceRef.current && onPinch) {
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / pinchDistanceRef.current;
      
      if (Math.abs(scale - 1) > pinchThreshold / 100) {
        onPinch({
          type: 'pinch',
          scale,
          deltaX: 0,
          deltaY: 0
        });
      }
    }
  }, [onPinch, pinchThreshold]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Reset pinch state
    pinchDistanceRef.current = null;

    if (!touchStartRef.current || isLongPress) {
      setIsLongPress(false);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (distance < 10 && deltaTime < 300) {
      // Tap gesture
      if (onTap) {
        onTap();
      }
    } else if (distance > swipeThreshold) {
      // Swipe gesture
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [isLongPress, onTap, onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeDown, swipeThreshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isLongPress
  };
};
