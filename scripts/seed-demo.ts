import { runScan } from "../src/lib/scan/orchestrator";
import { db } from "../src/lib/db";

async function main() {
  const r = await runScan({ mode: "demo" });
  console.log(JSON.stringify(r, null, 2));
  const n = await db.finding.count({ where: { scanId: r.scanId } });
  console.log(`persisted findings: ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
