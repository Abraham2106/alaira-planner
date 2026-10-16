import { createPortal } from "react-dom";
import { usePortalHost } from "../project/use-portal-host.js";
import { GanttWorkspace } from "./GanttWorkspace.js";
import { useGanttHash } from "./use-gantt-hash.js";

export const featureId = "gantt";
export const featureLabel = "Gantt schedule";

export function Feature() {
  const host = usePortalHost();
  const { active } = useGanttHash();

  if (!active || !host) {
    return null;
  }

  return createPortal(<GanttWorkspace />, host);
}
