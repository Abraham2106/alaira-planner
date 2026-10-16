import { createPortal } from "react-dom";
import { usePortalHost } from "../project/use-portal-host.js";
import { useProjectsHash } from "../project/use-projects-hash.js";
import { WbsWorkspace } from "./WbsWorkspace.js";

export const featureId = "wbs";
export const featureLabel = "WBS forms";

export function Feature() {
  const host = usePortalHost();
  const { active, view } = useProjectsHash();

  if (!active || view !== "wbs" || !host) {
    return null;
  }

  return createPortal(<WbsWorkspace />, host);
}
