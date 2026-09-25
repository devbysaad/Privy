/**
 * Send assignment email. Uses Resend when RESEND_API_KEY is set;
 * otherwise records a demo delivery and returns the body for UI display.
 */
export type SendMailResult =
  | { ok: true; mode: "resend" | "demo"; preview: string }
  | { ok: false; message: string };

export async function sendWorkAssignmentEmail(opts: {
  to: string;
  toName: string;
  title: string;
  message: string;
  solveUrl: string;
}): Promise<SendMailResult> {
  const subject = `[Privy] Work request: ${opts.title}`;
  const text = [
    `Hi ${opts.toName},`,
    "",
    `You've been assigned a work request:`,
    opts.title,
    "",
    opts.message ? `CEO note:\n${opts.message}\n` : "",
    `When you're done, mark it solved (like closing a PR):`,
    opts.solveUrl,
    "",
    "— Privy",
  ]
    .filter(Boolean)
    .join("\n");

  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM?.trim() || "Privy <onboarding@resend.dev>";

  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [opts.to],
          subject,
          text,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          message: `Email failed (${res.status}): ${body.slice(0, 200)}`,
        };
      }
      return { ok: true, mode: "resend", preview: text };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Email network error",
      };
    }
  }

  // Demo path — no SMTP. CEO still gets the link to share.
  console.info("[privy:mail:demo]", { to: opts.to, subject, solveUrl: opts.solveUrl });
  return { ok: true, mode: "demo", preview: text };
}
