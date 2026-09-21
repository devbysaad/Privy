import { AppShell } from "@/components/app-shell";
import { AssistantChat } from "@/components/assistant-chat";
import { privyDataMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  // Fixture stage defaults to sample data so chat syncs with Findings.
  const demo =
    sp.demo === "1" || (sp.demo !== "0" && privyDataMode() !== "live");

  return (
    <AppShell demo={demo}>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Company intelligence
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-ink">
          AI Command Center
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Ask about company activity, work, or security. Answers sync to the
          same scan as Findings — never invents events or revokes access.
        </p>
      </div>
      <AssistantChat demo={demo} />
    </AppShell>
  );
}
