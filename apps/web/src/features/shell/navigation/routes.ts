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
    description: "Lo que necesita tu decisión.",
  },
  {
    id: "my-work",
    hash: "#/my-work",
    label: "Mi trabajo",
    description: "Hoy, en progreso, esperando a alguien y lo que tenés que confirmar.",
  },
  {
    id: "projects",
    hash: "#/projects",
    label: "Proyectos",
    description: "Creá, abrí y seguí los proyectos de tu organización.",
  },
  {
    id: "entrar",
    hash: "#/entrar",
    label: "Entrar",
    description: "Entrá a tu organización.",
  },
];

const pageRoutes: ShellRoute[] = [
  {
    id: "registro",
    hash: "#/registro",
    label: "Registro",
    description: "Creá la organización.",
  },
  {
    id: "wbs",
    hash: "#/projects/wbs",
    label: "Paquetes",
    description: "Pesos y avance que aceptás.",
  },
  {
    id: "gantt",
    hash: "#/projects/gantt",
    label: "Cronograma",
    description: "Plan, previsión y lo que pasó. El plan no se arrastra.",
  },
  {
    id: "control",
    hash: "#/projects/control",
    label: "Control",
    description: "Excepciones y registro del proyecto.",
  },
  {
    id: "ejemplo",
    hash: "#/ejemplo",
    label: "Ejemplo",
    description: "Datos ilustrativos, aparte de tus proyectos.",
  },
];

export function routeFromHash(hash: string): ShellRoute {
  const raw = hash || "#/";
  const query = raw.indexOf("?");
  const normalized = query === -1 ? raw : raw.slice(0, query);
  return (
    pageRoutes.find((route) => route.hash === normalized) ??
    shellRoutes.find((route) => route.hash === normalized) ??
    shellRoutes[0]!
  );
}
