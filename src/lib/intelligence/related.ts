import type { CompanyEvent } from "@/types/intelligence";

function tokens(e: CompanyEvent): Set<string> {
  const bits: string[] = [
    e.title,
    e.description ?? "",
    e.resourceName ?? "",
    e.actorName ?? "",
  ];
  const meta = e.metadata?.keywords;
  if (Array.isArray(meta)) bits.push(...meta.map(String));
  const set = new Set<string>();
  for (const b of bits.join(" ").toLowerCase().split(/[^a-z0-9#-]+/)) {
    if (b.length >= 3) set.add(b);
  }
  return set;
}

/**
 * Deterministic related-event matching (keywords, issue keys, shared actors).
 * Relationships are heuristic — UI must say "may be related".
 */
export function findRelatedEvents(
  event: CompanyEvent,
  all: CompanyEvent[],
  limit = 5,
): CompanyEvent[] {
  const mine = tokens(event);
  const scored = all
    .filter((o) => o.id !== event.id)
    .map((o) => {
      const theirs = tokens(o);
      let score = 0;
      for (const t of mine) if (theirs.has(t)) score += 1;
      if (
        event.actorId &&
        o.actorId &&
        event.actorId === o.actorId &&
        event.source !== o.source
      ) {
        score += 2;
      }
      if (
        event.resourceName &&
        o.resourceName &&
        event.resourceName === o.resourceName
      ) {
        score += 2;
      }
      return { o, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.o);
}

export function eventsByDay(events: CompanyEvent[]) {
  const sorted = [...events].sort(
    (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
  );
  const map = new Map<string, CompanyEvent[]>();
  for (const e of sorted) {
    const day = e.timestamp.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(e);
    map.set(day, list);
  }
  return map;
}
