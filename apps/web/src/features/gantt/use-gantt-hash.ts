import { useCallback, useEffect, useState } from "react";

export function isGanttRouteHash(hash: string): boolean {
  const normalized = hash || "#/";
  return normalized === "#/projects/gantt" || normalized.startsWith("#/projects/gantt?");
}

export function useGanttHash() {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "#/",
  );

  const sync = useCallback(() => setHash(window.location.hash), []);

  useEffect(() => {
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [sync]);

  return {
    hash,
    active: isGanttRouteHash(hash),
  };
}
