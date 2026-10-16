import { useCallback, useEffect, useState } from "react";

export type ProjectsView = "overview" | "wbs";

function viewFromHash(hash: string): ProjectsView {
  const normalized = hash || "#/";
  if (normalized === "#/projects/wbs" || normalized.startsWith("#/projects/wbs?")) {
    return "wbs";
  }
  if (normalized === "#/projects" || normalized.startsWith("#/projects?")) {
    return "overview";
  }
  return "overview";
}

export function isProjectsAreaHash(hash: string): boolean {
  const normalized = hash || "#/";
  return normalized === "#/projects" || normalized.startsWith("#/projects");
}

export function useProjectsHash() {
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
    active: isProjectsAreaHash(hash),
    view: viewFromHash(hash),
  };
}
