import { assertConnectorCatalog } from "../src/lib/connectors";

assertConnectorCatalog();
console.log("connectors ok: catalog ≥ 30, scan-ready ⊆ {github,drive,slack}");
