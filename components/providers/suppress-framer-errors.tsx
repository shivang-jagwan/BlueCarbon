'use client';

import * as React from 'react';

/**
 * Suppresses the known framer-motion v12 bug where internal pointer capture
 * handlers throw "releasePointerCapture: No active pointer" on motion.div
 * elements even when no drag prop is set.
 *
 * See: https://github.com/framer/motion/issues/XXXX
 */
export function SuppressFramerMotionErrors() {
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (
        event.message?.includes('releasePointerCapture') ||
        event.message?.includes('setPointerCapture')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('error', handler, { capture: true });
    return () => window.removeEventListener('error', handler, { capture: true });
  }, []);

  return null;
}
