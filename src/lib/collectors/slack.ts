import { executeTool } from "@/lib/fastn/client";
import { FASTN_ACTIONS } from "@/lib/fastn/actions";
import { normalizeRole, isExternalEmail } from "@/lib/normalize/roles";
import type { Graph, Grant, Identity, Resource } from "@/types";

type Loose = Record<string, unknown>;

function asArray(data: unknown): Loose[] {
  if (Array.isArray(data)) return data as Loose[];
  if (data && typeof data === "object") {
    const o = data as Loose;
    for (const key of ["members", "users", "channels", "items", "data"]) {
      if (Array.isArray(o[key])) return o[key] as Loose[];
    }
  }
  return [];
}

export async function collectSlack(): Promise<Graph> {
  const usersRes = await executeTool(FASTN_ACTIONS.slack.listUsers, {});
  if (!usersRes.ok) {
    throw new Error(`Slack users: ${usersRes.message}`);
  }
  const channelsRes = await executeTool(FASTN_ACTIONS.slack.listChannels, {});
  if (!channelsRes.ok) {
    throw new Error(`Slack channels: ${channelsRes.message}`);
  }

  const identities: Identity[] = asArray(usersRes.data).map((u, i) => {
    const nativeId = String(u.id ?? u.user_id ?? `slack-${i}`);
    const email =
      typeof u.email === "string"
        ? u.email.toLowerCase()
        : typeof (u.profile as Loose | undefined)?.email === "string"
          ? String((u.profile as Loose).email).toLowerCase()
          : null;
    const guestType =
      u.is_restricted || u.is_ultra_restricted
        ? String(u.is_ultra_restricted ? "single_channel_guest" : "multi_channel_guest")
        : null;
    return {
      id: `sl:${nativeId}`,
      email,
      displayName: String(u.real_name ?? u.name ?? nativeId),
      aliases: [String(u.name ?? "")].filter(Boolean),
      guestType,
      external: isExternalEmail(email),
      unresolved: !email,
      sourcePlatforms: ["slack"],
      nativeIds: { slack: nativeId },
      lastActivity: null,
    };
  });

  const resources: Resource[] = asArray(channelsRes.data).map((c, i) => {
    const nativeId = String(c.id ?? `ch-${i}`);
    const name = String(c.name ?? nativeId);
    const isPrivate = Boolean(c.is_private ?? c.private ?? false);
    return {
      id: `sl-res:${nativeId}`,
      platform: "slack",
      nativeId,
      name,
      type: "channel",
      privacy: isPrivate ? "private" : "public",
      sensitivity: isPrivate ? "medium" : "low",
      publicLink: false,
    };
  });

  const grants: Grant[] = [];
  for (const res of resources.filter((r) => r.privacy === "private").slice(0, 15)) {
    const members = await executeTool(FASTN_ACTIONS.slack.listChannelMembers, {
      channel: res.nativeId,
    });
    if (!members.ok) continue;
    for (const m of asArray(members.data)) {
      const uid = String(m.id ?? m.user ?? "");
      if (!uid) continue;
      grants.push({
        id: `sl-grant:${res.nativeId}:${uid}`,
        identityId: `sl:${uid}`,
        resourceId: res.id,
        platform: "slack",
        nativeRole: "member",
        normalizedRole: normalizeRole("slack", "member"),
        lastActivity: null,
      });
    }
  }

  return { identities, resources, grants };
}
