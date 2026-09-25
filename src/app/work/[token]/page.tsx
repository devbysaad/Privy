import { SolveWorkButton } from "@/components/solve-work-button";
import { db } from "@/lib/db";
import { formatWhen } from "@/lib/labels";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WorkRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const task = await db.task.findUnique({ where: { solveToken: token } });

  if (!task) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6 py-16">
        <h1 className="font-heading text-xl font-semibold text-ink">
          Link expired or invalid
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask your CEO to resend the work request from Privy Tasks.
        </p>
        <Link href="/" className="mt-6 text-sm font-medium underline">
          Back to Privy
        </Link>
      </main>
    );
  }

  const done = task.status === "done";

  return (
    <main className="privy-mesh relative flex min-h-full flex-1 flex-col">
      <div className="privy-noise pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Privy · Work request
        </p>
        <h1 className="font-heading mt-2 text-2xl font-semibold text-ink">
          {task.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assigned to {task.assigneeName ?? "you"} ·{" "}
          {done ? `Solved ${formatWhen(task.solvedAt)}` : "Open — like a PR"}
        </p>

        {(task.message || task.description) && (
          <div className="mt-6 rounded-2xl border border-border bg-white px-4 py-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Message from CEO
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {task.message || task.description}
            </p>
          </div>
        )}

        <div className="mt-8">
          <SolveWorkButton token={token} alreadyDone={done} />
        </div>
      </div>
    </main>
  );
}
