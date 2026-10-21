import React, { lazy, ComponentType } from 'react';

/**
 * Resilient dynamic import wrapper for React.lazy.
 * Automatically handles network glitches, Vite server recompilations,
 * and chunk hash invalidation after new deployments or dev server reboots.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 800
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((component) => {
            // Clear reload tracker on successful load
            try {
              sessionStorage.removeItem('nova_chunk_retry_' + window.location.pathname);
            } catch {
              // ignore storage errors
            }
            resolve(component);
          })
          .catch((error: any) => {
            const errorMsg = String(error?.message || error || '');
            const isDynamicImportError =
              errorMsg.includes('Failed to fetch dynamically imported module') ||
              errorMsg.includes('Importing a module script failed') ||
              errorMsg.includes('error loading dynamically imported module') ||
              error?.name === 'TypeError';

            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), interval);
            } else if (isDynamicImportError) {
              const reloadKey = 'nova_chunk_retry_' + window.location.pathname;
              const hasRetried = (() => {
                try {
                  return sessionStorage.getItem(reloadKey);
                } catch {
                  return null;
                }
              })();

              if (!hasRetried) {
                try {
                  sessionStorage.setItem(reloadKey, '1');
                } catch {
                  // ignore
                }
                // Reload page to fetch the fresh bundle / chunk manifest
                window.location.reload();
                return;
              }
              reject(error);
            } else {
              reject(error);
            }
          });
      };

      attempt(retries);
    })
  );
}
