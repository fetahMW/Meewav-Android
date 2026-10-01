import { useLayoutEffect, useState, type RefObject } from 'react';

/** Internal pages advertise a return target to their Android shell. */
export function useFeatureReturnState(surfaceRef: RefObject<HTMLElement | null>) {
  const [hasReturn, setHasReturn] = useState(false);
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const update = () => setHasReturn(Boolean(surface.querySelector('[data-feature-return]')));
    const observer = new MutationObserver(update);
    observer.observe(surface, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-feature-return'] });
    update();
    return () => observer.disconnect();
  }, [surfaceRef]);
  return hasReturn;
}
