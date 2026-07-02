import { initDb, seedDatabase } from "../src/db.mjs";
import { seedPayload } from "../src/seed-data.mjs";

await initDb();
seedDatabase(seedPayload);
console.log("Seed data written to data/teiko.sqlite");
