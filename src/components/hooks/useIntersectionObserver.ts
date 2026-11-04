import { useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverArgs extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
}: UseIntersectionObserverArgs = {}): [
  (node: Element | null) => void,
  IntersectionObserverEntry | undefined
] {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [node, setNode] = useState<Element | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  // Callback ref to handle node mounting/unmounting
  const ref = useCallback((node: Element | null) => {
    setNode(node);
  }, []);

  // Update observer when node or params change
  if (
    typeof window !== 'undefined' &&
    window.IntersectionObserver &&
    node &&
    !frozen
  ) {
    // Disconnect previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create new observer
    observer.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    // Observe node
    observer.current.observe(node);
  }

  return [ref, entry];
}
