import { useState, type FormEvent } from "react";
import { loginRequest, logoutRequest, readStoredCsrfToken, registerRequest } from "./api.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPERCASE = /[A-ZÁÉÍÓÚÜÑ]/;

function uppercaseWarning(value: string): string | null {
  return HAS_UPPERCASE.test(value) ? "El identificador no puede tener mayúsculas." : null;
}

type AuthScreenProps = {
  mode: "login" | "register";
  notice: string | null;
  initialTenantSlug: string;
  initialEmail: string;
  onRegistered: (draft: { tenantSlug: string; email: string }) => void;
  onLoginSuccess: () => void;
};

export function AuthScreen({
  mode,
  notice,
  initialTenantSlug,
  initialEmail,
  onRegistered,
  onLoginSuccess,
}: AuthScreenProps) {
  const [tenantSlug, setTenantSlug] = useState(initialTenantSlug);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerDisplayName, setOwnerDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [hasSession, setHasSession] = useState(() => Boolean(readStoredCsrfToken()));

  async function onLogout() {
    setPending(true);
    setError(null);
    try {
      await logoutRequest();
      setHasSession(false);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message ? cause.message : "No se pudo cerrar la sesión.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new Set<string>();
    const messages: string[] = [];
    const slugValue = tenantSlug.trim();
    const emailValue = email.trim();
    const upper = uppercaseWarning(slugValue);
    if (upper) {
      next.add("tenant");
      messages.push(upper);
    } else if (slugValue.length < 2 || !SLUG_PATTERN.test(slugValue)) {
      next.add("tenant");
      messages.push("Ingresá la organización.");
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      next.add("email");
      messages.push("Ingresá un correo válido.");
    }
    if (password.length < 12) {
      next.add("password");
      messages.push(
        password.length === 0
          ? "Ingresá la contraseña."
          : "La contraseña necesita al menos 12 caracteres.",
      );
    }
    setInvalid(next);
    if (messages.length > 0) {
      setError(messages.join(" "));
      return;
    }

    setPending(true);
    setError(null);
    try {
      await loginRequest({ tenantSlug: slugValue, email: emailValue, password });
      onLoginSuccess();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "No se pudo entrar.");
    } finally {
      setPending(false);
    }
  }

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new Set<string>();
    const messages: string[] = [];
    const org = organizationName.trim();
    const slugValue = slug.trim();
    const name = ownerDisplayName.trim();
    const emailValue = email.trim();
    const upper = uppercaseWarning(slugValue);
    if (org.length < 2) {
      next.add("organization");
      messages.push("Ingresá el nombre de la organización.");
    }
    if (upper) {
      next.add("slug");
      messages.push(upper);
    } else if (!SLUG_PATTERN.test(slugValue) || slugValue.length > 64) {
      next.add("slug");
      messages.push("El identificador usa minúsculas, números y guiones.");
    }
    if (name.length < 1) {
      next.add("name");
      messages.push("Ingresá tu nombre.");
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      next.add("email");
      messages.push("Ingresá un correo válido.");
    }
    if (password.length < 12) {
      next.add("password");
      messages.push(
        password.length === 0
          ? "Ingresá la contraseña."
          : "La contraseña necesita al menos 12 caracteres.",
      );
    }
    setInvalid(next);
    if (messages.length > 0) {
      setError(messages.join(" "));
      return;
    }

    setPending(true);
    setError(null);
    try {
      await registerRequest({
        organizationName: org,
        slug: slugValue,
        ownerEmail: emailValue,
        ownerDisplayName: name,
        password,
      });
      onRegistered({ tenantSlug: slugValue, email: emailValue });
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "No se pudo registrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-screen" aria-labelledby="auth-title">
      <div className="auth-panel">
        <p className="auth-mark">
          <img src="/brand/logo-mark.png" alt="" width={44} height={44} />
          <span className="auth-mark-name">ALAIRA</span>
        </p>
        <h2 id="auth-title" className="auth-title">
          {mode === "login" ? "Entrá a tu organización." : "Creá tu organización."}
        </h2>
        {notice ? (
          <p className="auth-status" role="status">
            {notice}
          </p>
        ) : null}

        {mode === "login" ? (
          <form className="auth-form" noValidate onSubmit={onLogin}>
            <div className="auth-field">
              <label htmlFor="auth-tenant">Organización</label>
              <input
                id="auth-tenant"
                name="organization"
                type="text"
                autoComplete="organization"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={tenantSlug}
                aria-invalid={invalid.has("tenant") || undefined}
                aria-describedby={invalid.has("tenant") ? "auth-error" : undefined}
                onChange={(event) => setTenantSlug(event.target.value)}
              />
              {uppercaseWarning(tenantSlug) ? (
                <p className="auth-alert" role="alert">
                  {uppercaseWarning(tenantSlug)}
                </p>
              ) : null}
            </div>
            <div className="auth-field">
              <label htmlFor="auth-email">Correo</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                aria-invalid={invalid.has("email") || undefined}
                aria-describedby={invalid.has("email") ? "auth-error" : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Contraseña</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={invalid.has("password") || undefined}
                aria-describedby={invalid.has("password") ? "auth-error" : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p id="auth-error" className="auth-alert" role="alert">
                {error}
              </p>
            ) : null}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="auth-form" noValidate onSubmit={onRegister}>
            <div className="auth-field">
              <label htmlFor="auth-org-name">Nombre de la organización</label>
              <input
                id="auth-org-name"
                name="organization"
                type="text"
                autoComplete="organization"
                required
                value={organizationName}
                aria-invalid={invalid.has("organization") || undefined}
                aria-describedby={invalid.has("organization") ? "auth-error" : undefined}
                onChange={(event) => setOrganizationName(event.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-slug">Identificador</label>
              <input
                id="auth-slug"
                name="slug"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={slug}
                aria-invalid={invalid.has("slug") || HAS_UPPERCASE.test(slug) || undefined}
                aria-describedby={invalid.has("slug") ? "auth-error" : undefined}
                onChange={(event) => setSlug(event.target.value)}
              />
              {uppercaseWarning(slug) ? (
                <p className="auth-alert" role="alert">
                  {uppercaseWarning(slug)}
                </p>
              ) : null}
            </div>
            <div className="auth-field">
              <label htmlFor="auth-owner">Tu nombre</label>
              <input
                id="auth-owner"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={ownerDisplayName}
                aria-invalid={invalid.has("name") || undefined}
                aria-describedby={invalid.has("name") ? "auth-error" : undefined}
                onChange={(event) => setOwnerDisplayName(event.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-register-email">Correo</label>
              <input
                id="auth-register-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                aria-invalid={invalid.has("email") || undefined}
                aria-describedby={invalid.has("email") ? "auth-error" : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-register-password">Contraseña</label>
              <input
                id="auth-register-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                aria-invalid={invalid.has("password") || undefined}
                aria-describedby={invalid.has("password") ? "auth-error" : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p id="auth-error" className="auth-alert" role="alert">
                {error}
              </p>
            ) : null}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear organización"}
            </button>
          </form>
        )}

        {hasSession ? (
          <button className="auth-submit" type="button" disabled={pending} onClick={() => void onLogout()}>
            Cerrar sesión
          </button>
        ) : null}

        <p className="auth-switch">
          {mode === "login" ? (
            <>
              ¿No existe todavía? <a href="#/registro">Registrate</a>
            </>
          ) : (
            <>
              ¿Ya la creaste? <a href="#/entrar">Entrá</a>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
