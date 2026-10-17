import { shellRoutes, type ShellRoute } from "./routes.js";
import { Icon, type IconName } from "../Icon.js";
const icons: Record<string, IconName> = {
  home: "home",
  "my-work": "tasks",
  projects: "folder",
};
export function ShellNav({
  active,
  onNavigate,
}: {
  active: ShellRoute;
  onNavigate: (route: ShellRoute) => void;
}) {
  return (
    <ul className="shell-nav-list">
      {shellRoutes
        .filter((route) => route.id !== "entrar")
        .map((route) => (
          <li key={route.id}>
            <a
              href={route.hash}
              className="shell-nav-link"
              title={route.label}
              aria-current={route.id === active.id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(route);
              }}
            >
              <Icon name={icons[route.id] ?? "folder"} />
              <span>{route.label}</span>
            </a>
          </li>
        ))}
    </ul>
  );
}
