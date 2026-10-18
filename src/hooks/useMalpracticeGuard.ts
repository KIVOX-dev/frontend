import { useEffect, useRef } from "react";

export const MALPRACTICE_MESSAGE =
  "You switched away from the test screen. This is treated as malpractice, so the test was stopped immediately.";

/**
 * Fires `onViolation` once the moment a proctored test loses the screen: the
 * tab is hidden, the window is minimised, or focus moves to another window
 * or app. Listeners only exist while `active` is true, and the handler is
 * kept in a ref so the caller can pass an inline function without the
 * listeners being re-created (and a violation being missed) on every render.
 */
export function useMalpracticeGuard(active: boolean, onViolation: () => void) {
  const handlerRef = useRef(onViolation);
  useEffect(() => {
    handlerRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (!active) return;
    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      handlerRef.current();
    };
    const onVisibility = () => {
      if (document.hidden) trigger();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", trigger);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", trigger);
    };
  }, [active]);
}
