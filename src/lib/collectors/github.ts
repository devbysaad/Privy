import { executeTool } from "@/lib/fastn/client";
import { FASTN_ACTIONS } from "@/lib/fastn/actions";
import { normalizeRole, isExternalEmail } from "@/lib/normalize/roles";
import { classifySensitivity } from "@/lib/normalize/sensitivity";
import type { Graph, Grant, Identity, Resource } from "@/types";

type Loose = Record<string, unknown>;

function asArray(data: unknown): Loose[] {
  if (Array.isArray(data)) return data as Loose[];
  if (data && typeof data === "object") {
    const o = data as Loose;
    for (const key of ["members", "items", "data", "repos", "repositories", "users"]) {
      if (Array.isArray(o[key])) return o[key] as Loose[];
    }
  }
  return [];
}

export async function collectGithub(): Promise<Graph> {
  const membersRes = await executeTool(FASTN_ACTIONS.github.listOrgMembers, {});
  if (!membersRes.ok) {
    throw new Error(`GitHub members: ${membersRes.message}`);
  }
  const reposRes = await executeTool(FASTN_ACTIONS.github.listRepos, {});
  if (!reposRes.ok) {
    throw new Error(`GitHub repos: ${reposRes.message}`);
  }

  const identities: Identity[] = asArray(membersRes.data).map((m, i) => {
    const login = String(m.login ?? m.username ?? `github-user-${i}`);
    const email =
      typeof m.email === "string" && m.email.includes("@")
        ? m.email.toLowerCase()
        : null;
    return {
      id: `gh:${login}`,
      email,
      displayName: String(m.name ?? login),
      aliases: [login],
      department: typeof m.department === "string" ? m.department : null,
      external: isExternalEmail(email),
      unresolved: !email,
      sourcePlatforms: ["github"],
      nativeIds: { github: login },
      lastActivity: typeof m.last_activity === "string" ? m.last_activity : null,
    };
  });

  const resources: Resource[] = asArray(reposRes.data).map((r, i) => {
    const name = String(r.name ?? r.full_name ?? `repo-${i}`);
    const nativeId = String(r.full_name ?? r.id ?? name);
    const isPrivate = Boolean(r.private ?? r.is_private ?? true);
    return {
      id: `gh-res:${nativeId}`,
      platform: "github",
      nativeId,
      name,
      type: "repo",
      privacy: isPrivate ? "private" : "public",
      sensitivity: isPrivate ? "medium" : classifySensitivity(name),
      publicLink: false,
    };
  });

  const grants: Grant[] = [];
  for (const res of resources.slice(0, 20)) {
    const collab = await executeTool(FASTN_ACTIONS.github.listCollaborators, {
      repo: res.nativeId,
    });
    if (!collab.ok) continue;
    for (const c of asArray(collab.data)) {
      const login = String(c.login ?? c.username ?? "");
      if (!login) continue;
      const nativeRole = String(c.role_name ?? c.permission ?? c.role ?? "read");
      grants.push({
        id: `gh-grant:${res.nativeId}:${login}`,
        identityId: `gh:${login}`,
        resourceId: res.id,
        platform: "github",
        nativeRole,
        normalizedRole: normalizeRole("github", nativeRole),
        lastActivity:
          typeof c.last_activity === "string" ? c.last_activity : null,
      });
      if (!identities.some((id) => id.id === `gh:${login}`)) {
        identities.push({
          id: `gh:${login}`,
          email: null,
          displayName: login,
          aliases: [login],
          external: false,
          unresolved: true,
          sourcePlatforms: ["github"],
          nativeIds: { github: login },
        });
      }
    }
  }

  return { identities, resources, grants };
}
