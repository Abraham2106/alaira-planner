export const ACTIVE_PROJECT_STORAGE_KEY = "alaira-active-project";
export const ACTIVE_PROJECT_EVENT = "alaira-project";
export const PROJECT_QUERY_KEY = "project";

function storageGet(key: string): string {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(key)?.trim() ?? "";
  } catch {
    return "";
  }
}

function storageSet(key: string, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode: the hash still carries the id */
  }
}

function storageRemove(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function emitActiveProject(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTIVE_PROJECT_EVENT));
}

export function projectIdFromHash(hash: string): string {
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  return new URLSearchParams(query).get(PROJECT_QUERY_KEY)?.trim() ?? "";
}

/** Hash query wins. Session storage is only the active id, not a project database. */
export function readActiveProjectId(
  hash = typeof window === "undefined" ? "" : window.location.hash,
): string {
  const fromHash = projectIdFromHash(hash);
  if (fromHash) return fromHash;
  return storageGet(ACTIVE_PROJECT_STORAGE_KEY);
}

export function rememberActiveProjectId(projectId: string): void {
  const id = projectId.trim();
  if (!id || typeof window === "undefined") return;
  storageSet(ACTIVE_PROJECT_STORAGE_KEY, id);
  const raw = window.location.hash || "#/";
  const qIndex = raw.indexOf("?");
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  if (path.startsWith("#/projects")) {
    const params = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
    if (params.get(PROJECT_QUERY_KEY) !== id) {
      params.set(PROJECT_QUERY_KEY, id);
      const next = `${path}?${params.toString()}`;
      if (window.location.hash !== next) {
        window.location.hash = next;
      }
    }
  }
  emitActiveProject();
}

export function clearActiveProjectId(): void {
  storageRemove(ACTIVE_PROJECT_STORAGE_KEY);
  emitActiveProject();
}

export function hrefWithProject(hashPath: string, projectId?: string): string {
  const path = (hashPath.split("?")[0] || hashPath).trim();
  const id = (projectId ?? readActiveProjectId()).trim();
  if (!id || !path.startsWith("#/projects")) return path;
  const params = new URLSearchParams();
  params.set(PROJECT_QUERY_KEY, id);
  return `${path}?${params.toString()}`;
}
