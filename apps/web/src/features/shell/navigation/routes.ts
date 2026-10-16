export type ShellRoute = {
  id: string;
  hash: string;
  label: string;
  description: string;
};

export const shellRoutes: ShellRoute[] = [
  {
    id: "home",
    hash: "#/",
    label: "Inicio",
    description: "Resumen del espacio de trabajo y accesos rápidos.",
  },
  {
    id: "my-work",
    hash: "#/my-work",
    label: "Mi trabajo",
    description: "Cola personal de paquetes y decisiones pendientes.",
  },
  {
    id: "projects",
    hash: "#/projects",
    label: "Proyectos",
    description: "Listado de proyectos del tenant (formularios en TASK-0115).",
  },
];

export function routeFromHash(hash: string): ShellRoute {
  const normalized = hash || "#/";
  return shellRoutes.find((r) => r.hash === normalized) ?? shellRoutes[0]!;
}
