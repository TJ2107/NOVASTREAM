import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useTVRemoteNavigation() {
  const { tvMode } = useAppStore();

  useEffect(() => {
    if (!tvMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusables = Array.from(
        document.querySelectorAll('.tv-focusable, button, a, input, select')
      ) as HTMLElement[];

      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex < focusables.length - 1 ? currentIndex + 1 : 0;
        focusables[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
        focusables[prevIndex]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // If focused element is not an input/button, trigger click
        const active = document.activeElement as HTMLElement;
        if (active && active !== document.body) {
          active.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on first focusable if none focused
    const currentActive = document.activeElement as HTMLElement;
    if (!currentActive || currentActive === document.body) {
      const firstFocusable = document.querySelector('.tv-focusable, button, a') as HTMLElement;
      firstFocusable?.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tvMode]);
}
