import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Attaches an IntersectionObserver to a sentinel element.
 * When the sentinel enters the viewport, fetches the next page.
 *
 * Usage:
 *   const sentinelRef = useInfiniteScroll({ fetchNextPage, hasNextPage, isFetchingNextPage });
 *   <div ref={sentinelRef} />
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = "200px",
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Disconnect previous observer
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });
    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, rootMargin, threshold]);

  return sentinelRef;
}

/**
 * Simplified version for snap-scroll feed: triggers fetch when near the end.
 * Tracks scroll position within a container ref.
 */
export function useSnapScrollPrefetch(
  containerRef: React.RefObject<HTMLElement>,
  fetchNextPage: () => void,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  triggerThreshold = 0.7 // fetch when 70% scrolled
) {
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const scrollRatio = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    if (scrollRatio > triggerThreshold) {
      fetchNextPage();
    }
  }, [containerRef, fetchNextPage, hasNextPage, isFetchingNextPage, triggerThreshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);
}
