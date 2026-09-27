/**
 * Tiny self-check for production API helpers.
 * Run: npx tsx src/lib/api.check.ts
 */
import assert from "node:assert/strict";
import { rateLimit } from "./rate-limit";

const a = rateLimit("check:self", { limit: 2, windowMs: 60_000 });
assert.equal(a.ok, true);
const b = rateLimit("check:self", { limit: 2, windowMs: 60_000 });
assert.equal(b.ok, true);
const c = rateLimit("check:self", { limit: 2, windowMs: 60_000 });
assert.equal(c.ok, false);
if (!c.ok) assert.ok(c.retryAfterSec >= 1);

console.log("api.check ok");
