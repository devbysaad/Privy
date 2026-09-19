import type { Graph, Grant, Identity, Platform } from "@/types";

function normEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  return e.length ? e : null;
}

/**
 * Join identities on lowercased trimmed email only.
 * Missing email → unresolved (never merge on display name).
 * Returns the resolved graph (unresolved identities included, flagged).
 */
export function resolveIdentities(graph: Graph): Graph {
  return resolveWithMeta(graph).graph;
}

export function resolveWithMeta(graph: Graph): {
  graph: Graph;
  unresolved: Identity[];
} {
  const byEmail = new Map<string, Identity>();
  const unresolved: Identity[] = [];
  const idMap = new Map<string, string>();

  for (const raw of graph.identities) {
    const email = normEmail(raw.email);
    if (!email) {
      const u: Identity = {
        ...raw,
        email: null,
        unresolved: true,
        aliases: [...raw.aliases],
        sourcePlatforms: [...raw.sourcePlatforms],
        nativeIds: { ...raw.nativeIds },
      };
      unresolved.push(u);
      idMap.set(raw.id, u.id);
      continue;
    }

    const existing = byEmail.get(email);
    if (!existing) {
      const merged: Identity = {
        ...raw,
        email,
        unresolved: false,
        aliases: [...raw.aliases],
        sourcePlatforms: [...raw.sourcePlatforms],
        nativeIds: { ...raw.nativeIds },
      };
      byEmail.set(email, merged);
      idMap.set(raw.id, merged.id);
      continue;
    }

    idMap.set(raw.id, existing.id);
    for (const a of raw.aliases) {
      if (!existing.aliases.includes(a)) existing.aliases.push(a);
    }
    if (
      raw.displayName &&
      raw.displayName !== existing.displayName &&
      !existing.aliases.includes(raw.displayName)
    ) {
      existing.aliases.push(raw.displayName);
    }
    for (const p of raw.sourcePlatforms) {
      if (!existing.sourcePlatforms.includes(p)) existing.sourcePlatforms.push(p);
    }
    for (const [plat, nid] of Object.entries(raw.nativeIds) as [
      Platform,
      string,
    ][]) {
      if (nid && !existing.nativeIds[plat]) existing.nativeIds[plat] = nid;
    }
    if (raw.department && !existing.department) {
      existing.department = raw.department;
    }
    if (raw.guestType && !existing.guestType) existing.guestType = raw.guestType;
    existing.external = existing.external || raw.external;
    if (raw.lastActivity) {
      if (
        !existing.lastActivity ||
        raw.lastActivity > existing.lastActivity
      ) {
        existing.lastActivity = raw.lastActivity;
      }
    }
  }

  const identities = [...byEmail.values(), ...unresolved];
  const grants: Grant[] = graph.grants.map((g) => ({
    ...g,
    identityId: idMap.get(g.identityId) ?? g.identityId,
  }));

  return {
    graph: { identities, resources: graph.resources, grants },
    unresolved,
  };
}
