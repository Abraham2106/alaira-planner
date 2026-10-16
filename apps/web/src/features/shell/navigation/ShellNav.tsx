import { shellRoutes, type ShellRoute } from "./routes.js";

type ShellNavProps = {
  active: ShellRoute;
  onNavigate: (route: ShellRoute) => void;
};

export function ShellNav({ active, onNavigate }: ShellNavProps) {
  return (
    <nav className="shell-nav" aria-label="Principal">
      <ul className="shell-nav-list">
        {shellRoutes.map((route) => (
          <li key={route.id}>
            <a
              href={route.hash}
              className="shell-nav-link"
              aria-current={route.id === active.id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(route);
              }}
            >
              {route.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
