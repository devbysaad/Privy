/**
 * Fastn connection truth + OAuth initiate.
 * - POST /api/v1/oauth/initiate → provider authorize URL
 * - GET  /api/v1/connections    → which connectors are ACTIVE
 * - GET  /api/v1/connectors     → catalog (uuid ↔ slug)
 */

export function fastnEmbedHost(): string {
  return (
    process.env.FASTN_EMBED_HOST?.replace(/\/$/, "") ||
    "https://live.gcp.fastn.ai"
  );
}

export function fastnEmbedConfigured(): boolean {
  return Boolean(process.env.FASTN_API_KEY?.trim());
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

// ponytail: process-local catalog cache, 10 min TTL.
let catalogCache: {
  at: number;
  byUuid: Map<string, string>;
  bySlug: Map<string, string>;
} | null = null;
const CATALOG_TTL_MS = 10 * 60 * 1000;

async function loadCatalog(): Promise<{
  byUuid: Map<string, string>;
  bySlug: Map<string, string>;
}> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return catalogCache;
  }
  const res = await fetch(`${fastnEmbedHost()}/api/v1/connectors`, {
    headers: fastnHeaders(),
  });
  if (!res.ok) throw new Error(`Fastn connectors failed (${res.status})`);
  const json = (await res.json()) as {
    data?: Array<{ id?: string; slug?: string }>;
  };
  const byUuid = new Map<string, string>();
  const bySlug = new Map<string, string>();
  for (const c of json.data ?? []) {
    if (!c.id || !c.slug) continue;
    byUuid.set(c.id, c.slug);
    bySlug.set(normalize(c.slug), c.id);
  }
  catalogCache = { at: Date.now(), byUuid, bySlug };
  return catalogCache;
}

/** Fastn connector UUID → slug. */
async function connectorSlugsByUuid(): Promise<Map<string, string>> {
  return (await loadCatalog()).byUuid;
}

/** Resolve our catalog id to a Fastn connector UUID. */
export async function resolveConnectorUuid(
  connectorId: string,
): Promise<string | null> {
  const { bySlug } = await loadCatalog();
  return bySlug.get(normalize(fastnSlugFor(connectorId))) ?? null;
}

export type AuthProvider = {
  id?: string;
  isDefault?: boolean;
  authType?: string;
  name?: string;
};

/** Prefer default OAuth provider; else first oauth-ish entry. */
export function pickDefaultAuthProvider(
  providers: readonly AuthProvider[],
): AuthProvider | null {
  if (!providers.length) return null;
  const oauthish = providers.filter((p) =>
    /oauth/i.test(p.authType ?? p.name ?? ""),
  );
  const pool = oauthish.length ? oauthish : providers;
  return pool.find((p) => p.isDefault) ?? pool[0] ?? null;
}

export type InitiateOAuthResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; message: string; missing?: string[] };

export async function initiateOAuth(
  connectorId: string,
): Promise<InitiateOAuthResult> {
  if (!fastnEmbedConfigured()) {
    return {
      ok: false,
      missing: ["FASTN_API_KEY"],
      message: "Fastn not configured — set FASTN_API_KEY.",
    };
  }

  try {
    const uuid = await resolveConnectorUuid(connectorId);
    if (!uuid) {
      return {
        ok: false,
        message: `No Fastn connector for "${connectorId}".`,
      };
    }

    const providersRes = await fetch(
      `${fastnEmbedHost()}/api/v1/auth-providers?connectorId=${encodeURIComponent(uuid)}`,
      { headers: fastnHeaders() },
    );
    if (!providersRes.ok) {
      return {
        ok: false,
        message: `Fastn auth-providers failed (${providersRes.status})`,
      };
    }
    const providersJson = (await providersRes.json()) as {
      data?: AuthProvider[];
    };
    const provider = pickDefaultAuthProvider(providersJson.data ?? []);
    if (!provider?.id) {
      return {
        ok: false,
        message: `No OAuth provider for "${connectorId}" in Fastn.`,
      };
    }

    const initRes = await fetch(`${fastnEmbedHost()}/api/v1/oauth/initiate`, {
      method: "POST",
      headers: fastnHeaders(),
      body: JSON.stringify({
        connectorId: uuid,
        authProviderId: provider.id,
      }),
    });
    const initJson = (await initRes.json().catch(() => ({}))) as {
      data?: { authorizationUrl?: string };
      authorizationUrl?: string;
      message?: string;
      error?: string;
    };
    if (!initRes.ok) {
      return {
        ok: false,
        message:
          initJson.message ||
          initJson.error ||
          `Fastn oauth/initiate failed (${initRes.status})`,
      };
    }
    const authorizationUrl =
      initJson.data?.authorizationUrl ?? initJson.authorizationUrl;
    if (!authorizationUrl) {
      return { ok: false, message: "Fastn oauth/initiate missing authorizationUrl" };
    }
    return { ok: true, authorizationUrl };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "OAuth initiate network error",
    };
  }
}

export type LiveConnection = { connectorId: string; externalId: string };

export type FastnConnectionRow = {
  id?: string;
  connectorId?: string;
  status?: string;
  connector?: { slug?: string; name?: string; domain?: string };
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
    if (row.status !== "ACTIVE") continue;
    const slug =
      row.connector?.slug ??
      (row.connectorId ? slugByUuid.get(row.connectorId) : undefined);
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

export async function listFastnConnections(
  catalogIds: readonly string[],
): Promise<ListConnectionsResult> {
  if (!fastnEmbedConfigured()) {
    return {
      ok: false,
      message: "Fastn not configured — set FASTN_API_KEY.",
    };
  }

  try {
    const res = await fetch(`${fastnEmbedHost()}/api/v1/connections`, {
      headers: fastnHeaders(),
    });
    if (!res.ok) {
      return { ok: false, message: `Fastn connections failed (${res.status})` };
    }
    const json = (await res.json()) as { data?: FastnConnectionRow[] };
    const rows = json.data ?? [];
    const needsCatalog = rows.some(
      (r) => r.status === "ACTIVE" && !r.connector?.slug && r.connectorId,
    );
    const byUuid = needsCatalog
      ? await connectorSlugsByUuid()
      : new Map<string, string>();
    return {
      ok: true,
      connections: matchFastnConnections(rows, byUuid, catalogIds),
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Fastn connections error",
    };
  }
}
