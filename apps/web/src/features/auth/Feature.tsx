import { useState } from "react";
import { createPortal } from "react-dom";
import { AuthScreen } from "./AuthScreen.js";
import "./auth.css";
import { useAuthHash } from "./use-auth-hash.js";
import { usePortalHost } from "../project/use-portal-host.js";

export const featureId = "auth";
export const featureLabel = "Entrar y registro";

export function Feature() {
  const host = usePortalHost();
  const mode = useAuthHash();
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState({ tenantSlug: "", email: "" });

  if (!host || !mode) {
    return null;
  }

  return createPortal(
    <AuthScreen
      key={mode}
      mode={mode}
      notice={notice}
      initialTenantSlug={draft.tenantSlug}
      initialEmail={draft.email}
      onRegistered={(next) => {
        setDraft(next);
        setNotice("Organización creada. Entrá con ese correo.");
        if (window.location.hash !== "#/entrar") {
          window.location.hash = "#/entrar";
        }
      }}
      onLoginSuccess={() => {
        window.location.hash = "#/projects";
      }}
    />,
    host,
  );
}
