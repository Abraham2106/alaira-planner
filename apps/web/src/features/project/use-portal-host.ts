import { useEffect, useState } from "react";

/** Waits for the shell `#main-content` landmark (rendered by feature `shell`). */
export function usePortalHost(elementId = "feature-host"): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolve = () => {
      const el = document.getElementById(elementId);
      if (el) {
        setHost(el);
        return true;
      }
      return false;
    };
    if (resolve()) return;
    const observer = new MutationObserver(() => {
      if (!cancelled && resolve()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [elementId]);

  return host;
}
