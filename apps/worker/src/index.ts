import { discoverWorkerJobs } from "./bootstrap/load-jobs.js";

const pollMs = Number(process.env.WORKER_POLL_MS ?? 5000);

const jobs = await discoverWorkerJobs();
console.log("Discovered worker jobs:", jobs.map((j) => j.name));

async function loop(): Promise<void> {
  for (const job of jobs) {
    try {
      await job.tick();
    } catch (e) {
      console.error(`Job ${job.name} failed`, e);
    }
  }
}

setInterval(() => {
  void loop();
}, pollMs);

await loop();
