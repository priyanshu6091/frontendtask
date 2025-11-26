import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizablePanelOptions {
  defaultSize: number;
  minSize: number;
  maxSize: number;
  direction: 'horizontal' | 'vertical';
  storageKey?: string;
}

interface UseResizablePanelReturn {
  size: number;
  isResizing: boolean;
  startResize: (e: React.MouseEvent | React.TouchEvent) => void;
  resetSize: () => void;
}

export const useResizablePanel = ({
  defaultSize,
  minSize,
  maxSize,
  direction,
  storageKey
}: UseResizablePanelOptions): UseResizablePanelReturn => {
  // Load initial size from localStorage if available
  const getInitialSize = () => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minSize && parsed <= maxSize) {
          return parsed;
        }
      }
    }
    return defaultSize;
  };

  const [size, setSize] = useState(getInitialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  // Save size to localStorage when it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [size, storageKey]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // For horizontal (right sidebar): dragging left should increase size
    // For vertical (bottom panel): dragging up should increase size
    const delta = direction === 'horizontal'
      ? startPosRef.current - e.clientX
      : startPosRef.current - e.clientY; // Reversed: drag up = bigger

    let newSize = startSizeRef.current + delta;
    newSize = Math.max(minSize, Math.min(maxSize, newSize));
    
    setSize(newSize);
  }, [isResizing, direction, minSize, maxSize]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !e.touches[0]) return;

    const delta = direction === 'horizontal'
      ? startPosRef.current - e.touches[0].clientX
      : startPosRef.current - e.touches[0].clientY; // Reversed: drag up = bigger

    let newSize = startSizeRef.current + delta;
    newSize = Math.max(minSize, Math.min(maxSize, newSize));
    
    setSize(newSize);
  }, [isResizing, direction, minSize, maxSize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleTouchMove, handleMouseUp, direction]);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    if ('touches' in e) {
      startPosRef.current = direction === 'horizontal' 
        ? e.touches[0].clientX 
        : e.touches[0].clientY;
    } else {
      startPosRef.current = direction === 'horizontal' 
        ? e.clientX 
        : e.clientY;
    }
    startSizeRef.current = size;
  }, [size, direction]);

  const resetSize = useCallback(() => {
    setSize(defaultSize);
  }, [defaultSize]);

  return {
    size,
    isResizing,
    startResize,
    resetSize
  };
};
