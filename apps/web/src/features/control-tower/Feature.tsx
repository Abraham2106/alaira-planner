import { createPortal } from "react-dom";
import { useState } from "react";
import { usePortalHost } from "../project/use-portal-host.js";
import { AskCommandPanel } from "./AskCommandPanel.js";
import "./control-tower.css";
import { ControlTowerWorkspace } from "./ControlTowerWorkspace.js";
import { MyWorkWorkspace } from "./MyWorkWorkspace.js";
import { useControlTowerHash } from "./use-control-tower-hash.js";

function GlobalAskBar() {
  const [projectId, setProjectId] = useState("");
  return <AskCommandPanel projectId={projectId} onProjectIdChange={setProjectId} compact />;
}

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

  return createPortal(<GlobalAskBar />, host);
}
