import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { requireTenant, TenantAuthError } from "@/lib/tenant";
import { log } from "@/lib/logger";

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function jsonError(
  error: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<T> {
  const raw = await req.json().catch(() => ({}));
  return schema.parse(raw);
}

type Handler = (
  req: Request,
  ctx: { userId: string; orgId: string; params?: Record<string, string> },
) => Promise<Response>;

/** Auth + tenant + consistent error envelope for App Router handlers. */
export function withApi(handler: Handler) {
  return async (
    req: Request,
    routeCtx?: { params?: Promise<Record<string, string>> },
  ) => {
    try {
      const tenant = await requireTenant();
      const params = routeCtx?.params ? await routeCtx.params : undefined;
      return await handler(req, { ...tenant, params });
    } catch (err) {
      if (err instanceof TenantAuthError || (err as Error)?.message === "UNAUTHORIZED") {
        return jsonError("Unauthorized", 401);
      }
      if (err instanceof ZodError) {
        return jsonError("Invalid request", 400, {
          issues: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }
      log.error("api.unhandled", {
        err: err instanceof Error ? err.message : String(err),
        path: new URL(req.url).pathname,
      });
      return jsonError("Internal server error", 500);
    }
  };
}
