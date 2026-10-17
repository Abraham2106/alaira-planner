import type { ReactNode } from "react";
import type { ShellRoute } from "../navigation/routes.js";

type ShellPageContentProps = {
  route: ShellRoute;
  children?: ReactNode;
};

export function ShellPageContent({ route, children }: ShellPageContentProps) {
  if (route.id === "entrar" || route.id === "registro") {
    return children ? <>{children}</> : null;
  }

  return (
    <header className="shell-page-head">
      <h1 className="shell-page-title" id="shell-page-title">
        {route.label}
      </h1>
      <p className="shell-muted">{route.description}</p>
      {children}
    </header>
  );
}
