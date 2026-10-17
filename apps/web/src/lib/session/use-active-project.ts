import { useEffect, useState } from "react";
import { ACTIVE_PROJECT_EVENT, readActiveProjectId } from "./active-project.js";

export function useActiveProjectId(): string {
  const [id, setId] = useState(readActiveProjectId);

  useEffect(() => {
    const sync = () => setId(readActiveProjectId());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener(ACTIVE_PROJECT_EVENT, sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener(ACTIVE_PROJECT_EVENT, sync);
    };
  }, []);

  return id;
}
