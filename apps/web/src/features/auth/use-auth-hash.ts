import { useCallback, useEffect, useState } from "react";

export type AuthMode = "login" | "register";

export function authModeFromHash(hash: string): AuthMode | null {
  if (hash === "#/entrar") return "login";
  if (hash === "#/registro") return "register";
  return null;
}

export function useAuthHash(): AuthMode | null {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "",
  );

  const sync = useCallback(() => setHash(window.location.hash), []);

  useEffect(() => {
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [sync]);

  return authModeFromHash(hash);
}
