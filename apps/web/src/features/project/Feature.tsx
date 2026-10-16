import { createPortal } from "react-dom";
import { ProjectWorkspace } from "./ProjectWorkspace.js";
import { usePortalHost } from "./use-portal-host.js";
import { useProjectsHash } from "./use-projects-hash.js";

export const featureId = "project";
export const featureLabel = "Project forms";

export function Feature() {
  const host = usePortalHost();
  const { active, view } = useProjectsHash();

  if (!active || view !== "overview" || !host) {
    return null;
  }

  return createPortal(<ProjectWorkspace />, host);
}
