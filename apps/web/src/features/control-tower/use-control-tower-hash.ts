import { useCallback, useEffect, useState } from "react";

export type ControlTowerView =
  | "my-work"
  | "project-control"
  | "global-ask"
  | "inactive";

function normalizeHash(hash: string): string {
  return hash || "#/";
}

export function isMyWorkRoute(hash: string): boolean {
  const normalized = normalizeHash(hash);
  return normalized === "#/my-work" || normalized.startsWith("#/my-work?");
}

export function isProjectControlRoute(hash: string): boolean {
  const normalized = normalizeHash(hash);
  return normalized === "#/projects/control" || normalized.startsWith("#/projects/control?");
}

export function isGlobalAskRoute(hash: string): boolean {
  const normalized = normalizeHash(hash);
  if (isMyWorkRoute(normalized) || isProjectControlRoute(normalized)) return false;
  if (normalized === "#/" || normalized.startsWith("#/?")) return true;
  return false;
}

export function viewFromHash(hash: string): ControlTowerView {
  if (isMyWorkRoute(hash)) return "my-work";
  if (isProjectControlRoute(hash)) return "project-control";
  if (isGlobalAskRoute(hash)) return "global-ask";
  return "inactive";
}

export function useControlTowerHash() {
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
    view: viewFromHash(hash),
  };
}
