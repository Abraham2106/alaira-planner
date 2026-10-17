import { createPortal } from "react-dom";
import { usePortalHost } from "../project/use-portal-host.js";
import "./control-tower.css";
import { ControlTowerWorkspace } from "./ControlTowerWorkspace.js";
import { HomeInbox } from "./HomeInbox.js";
import { MyWorkWorkspace } from "./MyWorkWorkspace.js";
import { useControlTowerHash } from "./use-control-tower-hash.js";

export const featureId = "control-tower";
export const featureLabel = "Control Tower (My Work, cockpit, Ask/Command)";

export function Feature() {
  const host = usePortalHost();
  const { view } = useControlTowerHash();

  if (!host || view === "inactive") {
    return null;
  }

  if (view === "my-work") {
    return createPortal(<MyWorkWorkspace />, host);
  }

  if (view === "project-control") {
    return createPortal(<ControlTowerWorkspace />, host);
  }

  return createPortal(<HomeInbox />, host);
}
