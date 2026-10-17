export type WorkStatus = "Por hacer" | "En curso" | "En revisión" | "Aceptado";
export type WorkItem = {
  id: string;
  title: string;
  phase: string;
  status: WorkStatus;
  owner: string;
  name: string;
  priority: "Alta" | "Media" | "Baja";
  due: number;
  start: number;
  evidence: number;
  description: string;
};
export const statuses: WorkStatus[] = [
  "Por hacer",
  "En curso",
  "En revisión",
  "Aceptado",
];
export const statusClass: Record<WorkStatus, string> = {
  "Por hacer": "todo",
  "En curso": "doing",
  "En revisión": "review",
  Aceptado: "done",
};
export const exampleItems: WorkItem[] = [
  {
    id: "ALA-01",
    title: "Definir alcance y criterios de éxito",
    phase: "01 · Descubrimiento",
    status: "Aceptado",
    owner: "ML",
    name: "María López",
    priority: "Alta",
    due: 14,
    start: 12,
    evidence: 3,
    description:
      "Alinear el alcance del lanzamiento, sus entregables y los criterios de aceptación con las personas involucradas.",
  },
  {
    id: "ALA-02",
    title: "Mapear el recorrido del cliente",
    phase: "01 · Descubrimiento",
    status: "Aceptado",
    owner: "CR",
    name: "Carlos Rojas",
    priority: "Media",
    due: 15,
    start: 12,
    evidence: 2,
    description:
      "Documentar el recorrido desde el primer contacto hasta la activación del producto.",
  },
  {
    id: "ALA-03",
    title: "Validar arquitectura de la solución",
    phase: "01 · Descubrimiento",
    status: "Aceptado",
    owner: "DV",
    name: "Daniel Vargas",
    priority: "Alta",
    due: 16,
    start: 13,
    evidence: 2,
    description:
      "Revisar las decisiones técnicas y documentar los compromisos de la solución.",
  },
  {
    id: "ALA-04",
    title: "Diseñar la experiencia de onboarding",
    phase: "02 · Diseño y desarrollo",
    status: "En revisión",
    owner: "CR",
    name: "Carlos Rojas",
    priority: "Alta",
    due: 20,
    start: 16,
    evidence: 2,
    description:
      "Entregar el flujo de registro y primera configuración, incluyendo sus estados de error y accesibilidad.",
  },
  {
    id: "ALA-05",
    title: "Implementar el panel del proyecto",
    phase: "02 · Diseño y desarrollo",
    status: "En curso",
    owner: "DV",
    name: "Daniel Vargas",
    priority: "Alta",
    due: 23,
    start: 17,
    evidence: 1,
    description:
      "Construir la vista de trabajo compartida para que el equipo pueda revisar entregables, fechas y responsables.",
  },
  {
    id: "ALA-06",
    title: "Validar el flujo de pago",
    phase: "02 · Diseño y desarrollo",
    status: "En revisión",
    owner: "ML",
    name: "María López",
    priority: "Alta",
    due: 22,
    start: 18,
    evidence: 2,
    description:
      "Confirmar los escenarios de compra, cancelación y reintento antes de abrir el acceso al piloto.",
  },
  {
    id: "ALA-07",
    title: "Preparar pruebas con usuarios",
    phase: "03 · Validación y lanzamiento",
    status: "Por hacer",
    owner: "AS",
    name: "Ana Solano",
    priority: "Media",
    due: 27,
    start: 23,
    evidence: 0,
    description:
      "Preparar el guion, los criterios de observación y las sesiones del piloto.",
  },
  {
    id: "ALA-08",
    title: "Publicar la primera versión",
    phase: "03 · Validación y lanzamiento",
    status: "Por hacer",
    owner: "DV",
    name: "Daniel Vargas",
    priority: "Media",
    due: 30,
    start: 27,
    evidence: 0,
    description:
      "Verificar los entregables aceptados y completar la lista de lanzamiento antes de publicar.",
  },
];
