import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type AnchorRef =
  | RefObject<HTMLElement | null>
  | MutableRefObject<HTMLElement | null>;

interface UseNodePortalMenuArgs {
  isOpen: boolean;
  anchorRef: AnchorRef;
  onClose: () => void;
}

interface UseNodePortalMenuResult {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  position: { x: number; y: number };
  updatePosition: () => void;
}

/**
 * Keeps a contextual menu portal aligned with its trigger button even while
 * React Flow applies transforms for zooming or panning. Also handles closing
 * when clicking outside of the menu.
 */
export function useNodePortalMenu({
  isOpen,
  anchorRef,
  onClose,
}: UseNodePortalMenuArgs): UseNodePortalMenuResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition((prev) => {
      if (
        Math.abs(prev.x - rect.right) <= 0.5 &&
        Math.abs(prev.y - rect.bottom) <= 0.5
      ) {
        return prev;
      }
      return { x: rect.right, y: rect.bottom };
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const container = containerRef.current;
      if (
        container &&
        !container.contains(target) &&
        !anchorRef.current?.contains(target as HTMLElement)
      ) {
        onClose();
      }
    };

    const handleResizeOrScroll = () => updatePosition();

    document.addEventListener("mousedown", handleDocumentClick);
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [anchorRef, isOpen, onClose, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    let lastX = -1;
    let lastY = -1;

    const tick = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const nextX = rect.right;
      const nextY = rect.bottom;
      if (Math.abs(nextX - lastX) > 0.5 || Math.abs(nextY - lastY) > 0.5) {
        lastX = nextX;
        lastY = nextY;
        setPosition({ x: nextX, y: nextY });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [anchorRef, isOpen]);

  return {
    containerRef,
    position,
    updatePosition,
  };
}
