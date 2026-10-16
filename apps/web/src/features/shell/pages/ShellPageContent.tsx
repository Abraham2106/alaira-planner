import type { ReactNode } from "react";
import type { ShellRoute } from "../navigation/routes.js";

type ShellPageContentProps = {
  route: ShellRoute;
  children?: ReactNode;
};

export function ShellPageContent({ route, children }: ShellPageContentProps) {
  return (
    <>
      <h1 className="shell-page-title" id="shell-page-title">
        {route.label}
      </h1>
      <section className="shell-card" aria-labelledby="shell-page-title">
        <p className="shell-muted">{route.description}</p>
        {children}
      </section>
    </>
  );
}
