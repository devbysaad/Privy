/**
 * Fastn embedded widget — mint short-lived emb_ tokens server-side.
 * Docs: POST https://live.gcp.fastn.ai/api/v1/embed/token
 */

export function fastnEmbedHost(): string {
  return (
    process.env.FASTN_EMBED_HOST?.replace(/\/$/, "") ||
    "https://live.gcp.fastn.ai"
  );
}

/** Customer org UUID for the widget (Settings → Customers). */
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

export type MintEmbedResult =
  | { ok: true; token: string; iframeUrl: string; expiresIn: number }
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
        "Fastn embed needs FASTN_API_KEY and FASTN_END_ORG_ID (customer UUID from Fastn → Customers).",
    };
  }

  const host = fastnEmbedHost();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (key!.startsWith("fsk_test_")) {
    headers["X-fastn-Test-Mode"] = "true";
  }
  if (process.env.FASTN_ORG_ID?.trim()) {
    headers["x-org-id"] = process.env.FASTN_ORG_ID.trim();
  }

  try {
    const res = await fetch(`${host}/api/v1/embed/token`, {
      method: "POST",
      headers,
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
    const iframeUrl = `${host}/api/v1/embed/iframe?token=${encodeURIComponent(token)}`;
    return { ok: true, token, iframeUrl, expiresIn };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Embed token network error",
    };
  }
}
