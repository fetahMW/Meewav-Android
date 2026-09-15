import { useLayoutEffect, useRef } from 'react';

/** Reserve the real height of the floating input, including replies and uploads. */
export function useFloatingComposer() {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const composers = new Map<HTMLElement, { scene: HTMLElement; timeline: HTMLElement; height: number }>();
    const sizes = new ResizeObserver(entries => {
      for (const entry of entries) {
        const composer = entry.target as HTMLElement;
        const context = composers.get(composer);
        if (!context) continue;
        const height = Math.ceil(entry.borderBoxSize[0]?.blockSize ?? composer.offsetHeight);
        // Hidden contact lists must not erase the inset of their conversation.
        if (height === 0 || height === context.height) continue;
        const { scene, timeline } = context;
        const followingLatest = context.height > 0
          && timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop < 24;
        scene.style.setProperty('--mobile-composer-inset', `${height}px`);
        context.height = height;
        // Grow a multiline draft without covering the last message or pulling
        // somebody away from older messages they are reading.
        if (followingLatest) timeline.scrollTop = timeline.scrollHeight;
      }
    });

    const connect = () => {
      for (const [composer, { scene }] of composers) {
        if (surface.contains(composer)) continue;
        sizes.unobserve(composer);
        scene.style.removeProperty('--mobile-composer-inset');
        composers.delete(composer);
      }
      surface.querySelectorAll<HTMLElement>('.mw-chat-scene > .mw-composer-zone').forEach(composer => {
        if (composers.has(composer)) return;
        const scene = composer.parentElement!;
        const timeline = scene.querySelector<HTMLElement>(':scope > .mw-chat-timeline');
        if (!timeline) return;
        composers.set(composer, { scene, timeline, height: 0 });
        sizes.observe(composer, { box: 'border-box' });
      });
    };
    connect();

    // Conversations in Collabs, Projects and Groups mount inside their own
    // React components. Reconnect only when a composer mounts or unmounts;
    // typing and incoming messages do not need another layout scan.
    const mounts = new MutationObserver(records => {
      const changed = records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && (node.matches('.mw-composer-zone') || node.querySelector('.mw-composer-zone')),
      ));
      if (changed) connect();
    });
    mounts.observe(surface, { childList: true, subtree: true });

    return () => {
      mounts.disconnect();
      sizes.disconnect();
      for (const { scene } of composers.values()) scene.style.removeProperty('--mobile-composer-inset');
    };
  }, []);

  return surfaceRef;
}
