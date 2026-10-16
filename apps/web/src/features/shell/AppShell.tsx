import { useCallback, useEffect, useState, type ReactNode } from "react";
import "../../styles/shell.css";
import { DateTimeBanner } from "./datetime/DateTimeBanner.js";
import { ShellNav } from "./navigation/ShellNav.js";
import { routeFromHash, type ShellRoute } from "./navigation/routes.js";
import { ShellPageContent } from "./pages/ShellPageContent.js";

export type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [activeRoute, setActiveRoute] = useState<ShellRoute>(() =>
    routeFromHash(typeof window !== "undefined" ? window.location.hash : "#/"),
  );

  const syncHash = useCallback(() => {
    setActiveRoute(routeFromHash(window.location.hash));
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  const navigate = useCallback((route: ShellRoute) => {
    if (window.location.hash !== route.hash) {
      window.location.hash = route.hash;
    }
    setActiveRoute(route);
  }, []);

  const focusMain = useCallback(() => {
    const main = document.getElementById("main-content");
    main?.focus();
  }, []);

  return (
    <div className="shell-root">
      <a href="#main-content" className="shell-skip-link" onClick={focusMain}>
        Saltar al contenido principal
      </a>
      <div className="shell-layout">
        <header className="shell-header">
          <p className="shell-brand">Alaira Planner</p>
          <DateTimeBanner />
        </header>
        <ShellNav active={activeRoute} onNavigate={navigate} />
        <main id="main-content" className="shell-main" tabIndex={-1}>
          <ShellPageContent route={activeRoute}>{children}</ShellPageContent>
        </main>
      </div>
    </div>
  );
}
