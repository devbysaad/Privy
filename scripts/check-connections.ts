import assert from "node:assert/strict";
import {
  fastnSlugFor,
  matchFastnConnections,
} from "../src/lib/fastn/embed";
import { CONNECTOR_CATALOG } from "../src/lib/connectors";

const catalogIds = CONNECTOR_CATALOG.map((c) => c.id);

// Real UUIDs observed from GET /api/v1/connectors
const GITHUB_UUID = "64cbe4f6-7e1e-4859-96e7-7699123aaedc";
const DRIVE_UUID = "771fd846-8d4e-4cef-8045-571d3a0eafcc";
const slugByUuid = new Map([
  [GITHUB_UUID, "github"],
  [DRIVE_UUID, "googleDrive"],
]);

// Catalog ids whose Fastn slug differs must be aliased, or they never verify.
assert.equal(fastnSlugFor("drive"), "googleDrive");
assert.equal(fastnSlugFor("github"), "github");

const matched = matchFastnConnections(
  [
    { id: "ucl:github", connectorId: GITHUB_UUID, status: "ACTIVE" },
    { id: "ucl:drive", connectorId: DRIVE_UUID, status: "ACTIVE" },
    { id: "ucl:revoked", connectorId: GITHUB_UUID, status: "INACTIVE" },
    { id: "ucl:unknown", connectorId: "not-a-real-uuid", status: "ACTIVE" },
    { id: "ucl:nostatus", connectorId: DRIVE_UUID },
  ],
  slugByUuid,
  catalogIds,
);

const ids = matched.map((m) => m.connectorId).sort();
assert.deepEqual(ids, ["drive", "github"], `unexpected matches: ${ids}`);
assert.equal(matched.find((m) => m.connectorId === "github")?.externalId, "ucl:github");

// Nothing is connected when Fastn reports nothing.
assert.deepEqual(matchFastnConnections([], slugByUuid, catalogIds), []);

console.log(
  "connections ok: only ACTIVE + known-slug rows verify (drive→googleDrive aliased)",
);
