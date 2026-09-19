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
    for (const key of ["files", "items", "data", "permissions"]) {
      if (Array.isArray(o[key])) return o[key] as Loose[];
    }
  }
  return [];
}

export async function collectDrive(): Promise<Graph> {
  const filesRes = await executeTool(FASTN_ACTIONS.drive.listFiles, {});
  if (!filesRes.ok) {
    throw new Error(`Drive files: ${filesRes.message}`);
  }

  const identities: Identity[] = [];
  const resources: Resource[] = [];
  const grants: Grant[] = [];
  const seen = new Set<string>();

  for (const f of asArray(filesRes.data)) {
    const nativeId = String(f.id ?? f.fileId ?? "");
    if (!nativeId) continue;
    const name = String(f.name ?? f.title ?? nativeId);
    const publicLink = Boolean(
      f.publicLink ?? f.anyoneWithLink ?? f.shared ?? false,
    );
    const resource: Resource = {
      id: `drv-res:${nativeId}`,
      platform: "drive",
      nativeId,
      name,
      type: String(f.mimeType ?? "").includes("folder") ? "folder" : "file",
      privacy: publicLink ? "public" : "private",
      sensitivity: classifySensitivity(name),
      publicLink,
    };
    resources.push(resource);

    const permsRes = await executeTool(FASTN_ACTIONS.drive.listPermissions, {
      fileId: nativeId,
    });
    if (!permsRes.ok) continue;

    for (const p of asArray(permsRes.data)) {
      const email =
        typeof p.emailAddress === "string"
          ? p.emailAddress.toLowerCase()
          : typeof p.email === "string"
            ? p.email.toLowerCase()
            : null;
      if (!email) continue;
      const idKey = `drv:${email}`;
      if (!seen.has(idKey)) {
        seen.add(idKey);
        identities.push({
          id: idKey,
          email,
          displayName: String(p.displayName ?? email),
          aliases: [],
          external: isExternalEmail(email),
          unresolved: false,
          sourcePlatforms: ["drive"],
          nativeIds: { drive: email },
        });
      }
      const nativeRole = String(p.role ?? "reader");
      grants.push({
        id: `drv-grant:${nativeId}:${email}`,
        identityId: idKey,
        resourceId: resource.id,
        platform: "drive",
        nativeRole,
        normalizedRole: normalizeRole("drive", nativeRole),
        publicLink,
        lastActivity: null,
      });
    }
  }

  return { identities, resources, grants };
}
