import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Shared plumbing for modal-style overlays. Rendering into document.body (instead of wherever the
// page happened to mount the component) keeps the overlay out of the page's flow: no stray
// space-y margins, no clipping by the scrolling <main>, and a viewport-sized backdrop regardless
// of the caller's layout. While open the body scroll is locked so the page behind cannot move,
// and Escape closes.
export const useOverlay = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);
};

export const portal = (node: React.ReactNode) =>
  typeof document === 'undefined' ? node : createPortal(node, document.body);
