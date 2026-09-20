/**
 * Fastn embedded widget + connection truth.
 * - POST /api/v1/embed/token  → short-lived emb_ token for the in-app iframe
 * - GET  /api/v1/connections  → which connectors this tenant actually has
 * - GET  /api/v1/connectors   → catalog, used to map Fastn UUIDs to our ids
 */

export function fastnEmbedHost(): string {
  return (
    process.env.FASTN_EMBED_HOST?.replace(/\/$/, "") ||
    "https://live.gcp.fastn.ai"
  );
}

/**
 * Tenant the widget and connections belong to. FASTN_END_ORG_ID (customer UUID)
 * wins; the space/project id is a verified-working fallback for a personal org.
 */
export function fastnEndOrgId(): string | null {
  return (
    process.env.FASTN_END_ORG_ID?.trim() ||
    process.env.FASTN_SPACE_ID?.trim() ||
    process.env.FASTN_PROJECT_ID?.trim() ||
    null
  );
}

export function fastnEmbedConfigured(): boolean {
  return Boolean(process.env.FASTN_API_KEY?.trim() && fastnEndOrgId());
}

function fastnHeaders(): Record<string, string> {
  const key = process.env.FASTN_API_KEY?.trim() ?? "";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (key.startsWith("fsk_test_")) headers["X-fastn-Test-Mode"] = "true";
  if (process.env.FASTN_ORG_ID?.trim()) {
    headers["x-org-id"] = process.env.FASTN_ORG_ID.trim();
  }
  return headers;
}

export type MintEmbedResult =
  | {
      ok: true;
      token: string;
      iframeUrl: string;
      expiresIn: number;
      endOrgId: string;
    }
  | { ok: false; missing?: string[]; message: string };

export async function mintEmbedToken(opts: {
  userEmail: string;
  userName: string;
}): Promise<MintEmbedResult> {
  const key = process.env.FASTN_API_KEY?.trim();
  const endOrgId = fastnEndOrgId();
  const missing: string[] = [];
  if (!key) missing.push("FASTN_API_KEY");
  if (!endOrgId) missing.push("FASTN_END_ORG_ID");
  if (missing.length) {
    return {
      ok: false,
      missing,
      message:
        "Fastn embed needs FASTN_API_KEY plus a tenant — FASTN_END_ORG_ID (customer UUID) or FASTN_SPACE_ID.",
    };
  }

  const host = fastnEmbedHost();

  try {
    const res = await fetch(`${host}/api/v1/embed/token`, {
      method: "POST",
      headers: fastnHeaders(),
      body: JSON.stringify({
        endOrgId,
        userEmail: opts.userEmail,
        userName: opts.userName,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { token?: string; expiresIn?: number };
      token?: string;
      expiresIn?: number;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        message:
          json.message ||
          json.error ||
          `Fastn embed token failed (${res.status})`,
      };
    }

    const token = json.data?.token ?? json.token;
    if (!token) {
      return { ok: false, message: "Fastn embed response missing token" };
    }

    const expiresIn = json.data?.expiresIn ?? json.expiresIn ?? 900;
    const iframeUrl = `${host}/api/v1/embed/iframe?token=${encodeURIComponent(token)}&tenant-id=${encodeURIComponent(endOrgId!)}`;
    return { ok: true, token, iframeUrl, expiresIn, endOrgId: endOrgId! };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Embed token network error",
    };
  }
}

/** Our catalog id → Fastn connector slug, where they differ. */
const SLUG_ALIASES: Record<string, string> = {
  drive: "googleDrive",
  zendesk: "zendeskSupport",
  aws: "awsS3",
  azuread: "microsoftEntraId",
  teams: "microsoftTeams",
  gmail: "googleGmail",
};

export function fastnSlugFor(connectorId: string): string {
  return SLUG_ALIASES[connectorId] ?? connectorId;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ponytail: process-local catalog cache, 10 min TTL. 424 connectors change
// rarely; upgrade to a shared cache if this ever runs multi-instance.
let catalogCache: { at: number; byUuid: Map<string, string> } | null = null;
const CATALOG_TTL_MS = 10 * 60 * 1000;

/** Fastn connector UUID → slug. */
async function connectorSlugsByUuid(): Promise<Map<string, string>> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache.byUuid;
  }
  const res = await fetch(`${fastnEmbedHost()}/api/v1/connectors`, {
    headers: fastnHeaders(),
  });
  if (!res.ok) throw new Error(`Fastn connectors failed (${res.status})`);
  const json = (await res.json()) as { data?: Array<{ id?: string; slug?: string }> };
  const byUuid = new Map<string, string>();
  for (const c of json.data ?? []) {
    if (c.id && c.slug) byUuid.set(c.id, c.slug);
  }
  catalogCache = { at: Date.now(), byUuid };
  return byUuid;
}

export type LiveConnection = { connectorId: string; externalId: string };

export type FastnConnectionRow = {
  id?: string;
  connectorId?: string;
  status?: string;
};

/**
 * Pure mapping: Fastn connection rows → our catalog ids.
 * Only ACTIVE rows whose connector resolves to a known slug count.
 */
export function matchFastnConnections(
  rows: readonly FastnConnectionRow[],
  slugByUuid: ReadonlyMap<string, string>,
  catalogIds: readonly string[],
): LiveConnection[] {
  const slugToCatalogId = new Map(
    catalogIds.map((id) => [normalize(fastnSlugFor(id)), id]),
  );
  const matched: LiveConnection[] = [];
  for (const row of rows) {
    if (row.status !== "ACTIVE" || !row.connectorId) continue;
    const slug = slugByUuid.get(row.connectorId);
    if (!slug) continue;
    const catalogId = slugToCatalogId.get(normalize(slug));
    if (!catalogId) continue;
    matched.push({ connectorId: catalogId, externalId: row.id ?? "" });
  }
  return matched;
}

export type ListConnectionsResult =
  | { ok: true; connections: LiveConnection[] }
  | { ok: false; message: string };

/**
 * Live truth from Fastn: which of our catalog connectors are ACTIVE.
 * `catalogIds` scopes the slug matching to connectors Privy knows about.
 */
export async function listFastnConnections(
  catalogIds: readonly string[],
): Promise<ListConnectionsResult> {
  if (!fastnEmbedConfigured()) {
    return {
      ok: false,
      message: "Fastn not configured — set FASTN_API_KEY and FASTN_END_ORG_ID.",
    };
  }

  try {
    const [byUuid, res] = await Promise.all([
      connectorSlugsByUuid(),
      fetch(`${fastnEmbedHost()}/api/v1/connections`, { headers: fastnHeaders() }),
    ]);
    if (!res.ok) {
      return { ok: false, message: `Fastn connections failed (${res.status})` };
    }
    const json = (await res.json()) as { data?: FastnConnectionRow[] };
    return {
      ok: true,
      connections: matchFastnConnections(json.data ?? [], byUuid, catalogIds),
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Fastn connections error",
    };
  }
}
