import assert from "node:assert/strict";
import {
  fastnSlugFor,
  matchFastnConnections,
  pickDefaultAuthProvider,
} from "../src/lib/fastn/embed";
import {
  CONNECTOR_CATALOG,
  connectorConnectable,
} from "../src/lib/connectors";

const catalogIds = CONNECTOR_CATALOG.map((c) => c.id);

// Real UUIDs observed from GET /api/v1/connectors
const GITHUB_UUID = "64cbe4f6-7e1e-4859-96e7-7699123aaedc";
const DRIVE_UUID = "771fd846-8d4e-4cef-8045-571d3a0eafcc";
const slugByUuid = new Map([
  [GITHUB_UUID, "github"],
  [DRIVE_UUID, "googleDrive"],
]);

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
assert.equal(
  matched.find((m) => m.connectorId === "github")?.externalId,
  "ucl:github",
);

const fromSlug = matchFastnConnections(
  [
    {
      id: "ucl:slack",
      connectorId: "any-uuid",
      status: "ACTIVE",
      connector: { slug: "slack" },
    },
  ],
  new Map(),
  catalogIds,
);
assert.deepEqual(
  fromSlug.map((m) => m.connectorId),
  ["slack"],
);

assert.deepEqual(matchFastnConnections([], slugByUuid, catalogIds), []);

// slug → uuid resolution (pure map, mirrors loadCatalog bySlug)
const bySlug = new Map([
  ["github", GITHUB_UUID],
  ["googledrive", DRIVE_UUID],
]);
function resolveSlug(id: string) {
  const slug = fastnSlugFor(id).toLowerCase().replace(/[^a-z0-9]/g, "");
  return bySlug.get(slug) ?? null;
}
assert.equal(resolveSlug("github"), GITHUB_UUID);
assert.equal(resolveSlug("drive"), DRIVE_UUID);
assert.equal(resolveSlug("okta"), null);

// Default auth provider pick
const picked = pickDefaultAuthProvider([
  { id: "a", authType: "api_key", isDefault: true },
  { id: "b", authType: "oauth2", isDefault: false },
  { id: "c", authType: "oauth2", isDefault: true },
]);
assert.equal(picked?.id, "c");
assert.equal(pickDefaultAuthProvider([])?.id, undefined);
assert.equal(
  pickDefaultAuthProvider([{ id: "only", authType: "oauth" }])?.id,
  "only",
);

assert.equal(connectorConnectable("jira"), true);
assert.equal(connectorConnectable("okta"), false);
assert.equal(connectorConnectable("linear"), false);

console.log(
  "connections ok: ACTIVE+slug verify, oauth provider pick, connectable set",
);
