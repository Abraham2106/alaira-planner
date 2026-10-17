import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePortalHost } from "../project/use-portal-host.js";
import { WorkHub } from "./WorkHub.js";

export const featureId = "ejemplo";
export const featureLabel = "Ejemplo ilustrativo";

function pathOf(hash: string): string {
  const raw = hash || "#/";
  const query = raw.indexOf("?");
  return query === -1 ? raw : raw.slice(0, query);
}

export function Feature() {
  const host = usePortalHost();
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "",
  );
  const sync = useCallback(() => setHash(window.location.hash), []);

  useEffect(() => {
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [sync]);

  if (!host || pathOf(hash) !== "#/ejemplo") return null;
  return createPortal(<WorkHub />, host);
}
