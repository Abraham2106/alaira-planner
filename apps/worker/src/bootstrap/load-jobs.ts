import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type WorkerJob = {
  name: string;
  tick: () => Promise<void>;
};

const jobsRoot = join(dirname(fileURLToPath(import.meta.url)), "../jobs");

export async function discoverWorkerJobs(): Promise<WorkerJob[]> {
  const entries = readdirSync(jobsRoot, { withFileTypes: true });
  const jobs: WorkerJob[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(jobsRoot, entry.name, "index.ts");
    try {
      statSync(indexPath);
    } catch {
      continue;
    }
    const mod = (await import(pathToFileURL(indexPath).href)) as {
      tick?: WorkerJob["tick"];
    };
    if (typeof mod.tick === "function") {
      jobs.push({ name: entry.name, tick: mod.tick });
    }
  }
  return jobs.sort((a, b) => a.name.localeCompare(b.name));
}
