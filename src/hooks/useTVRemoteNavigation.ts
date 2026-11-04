import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useTVRemoteNavigation() {
  const { tvMode } = useAppStore();

  useEffect(() => {
    if (!tvMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName)) return;

      const focusables = Array.from(
        document.querySelectorAll('.tv-focusable, button, a, input, select')
      ) as HTMLElement[];

      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(activeEl);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex < focusables.length - 1 ? currentIndex + 1 : 0;
        focusables[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
        focusables[prevIndex]?.focus();
      } else if (e.key === 'Enter') {
        // Trigger click only on custom tv-focusable elements (buttons, links, etc. handle native click)
        if (activeEl && activeEl !== document.body && activeEl.tagName !== 'BUTTON' && activeEl.tagName !== 'A' && activeEl.tagName !== 'INPUT') {
          activeEl.click();
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
