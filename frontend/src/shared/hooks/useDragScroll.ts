import { useEffect, useRef } from 'react';

interface UseDragScrollOptions {
  containerRef: React.RefObject<HTMLElement>;
}

export function useDragScroll({ containerRef }: UseDragScrollOptions) {
  const wasDraggedRef = useRef(false);
  const dragThreshold = 5; // px

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      wasDraggedRef.current = false;
      startX = e.pageX;
      scrollStart = container.scrollLeft;
      container.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const delta = e.pageX - startX;
      if (Math.abs(delta) > dragThreshold) {
        wasDraggedRef.current = true;
      }

      container.scrollLeft = scrollStart - delta;
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', onMouseDown);
    // Attach move/up to window so dragging works even if mouse leaves the element
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.style.cursor = '';
    };
  }, [containerRef]);

  return {
    wasDraggedRef,
  };
}
