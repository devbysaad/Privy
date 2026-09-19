import type { Graph, Platform, PlatformCoverage } from "@/types";
import { collectGithub } from "@/lib/collectors/github";
import { collectDrive } from "@/lib/collectors/drive";
import { collectSlack } from "@/lib/collectors/slack";

function emptyGraph(): Graph {
  return { identities: [], resources: [], grants: [] };
}

function merge(a: Graph, b: Graph): Graph {
  return {
    identities: [...a.identities, ...b.identities],
    resources: [...a.resources, ...b.resources],
    grants: [...a.grants, ...b.grants],
  };
}

export async function collectAll(): Promise<{
  graph: Graph;
  coverage: PlatformCoverage[];
}> {
  const coverage: PlatformCoverage[] = [];
  let graph = emptyGraph();

  const runners: Array<{
    platform: Platform;
    run: () => Promise<Graph>;
  }> = [
    { platform: "github", run: collectGithub },
    { platform: "drive", run: collectDrive },
    { platform: "slack", run: collectSlack },
  ];

  for (const { platform, run } of runners) {
    try {
      const partial = await run();
      graph = merge(graph, partial);
      coverage.push({ platform, status: "ok" });
    } catch (err) {
      coverage.push({
        platform,
        status: "failed",
        errorClass: "unavailable",
        message: err instanceof Error ? err.message : "Collection failed",
      });
    }
  }

  return { graph, coverage };
}
