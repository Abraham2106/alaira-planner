import { loadDbConfig } from "./config.js";
import { migrate } from "./migrate.js";

const direction = process.argv[2] === "down" ? "down" : "up";
const { adminUrl } = loadDbConfig();
await migrate(adminUrl, direction);
console.log(`Migration ${direction} complete`);
