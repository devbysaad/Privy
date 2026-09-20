import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { mintEmbedToken } from "@/lib/fastn/embed";

/** Mint a short-lived Fastn embed token for the in-app widget iframe. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress ||
    `${userId}@privy.local`;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Privy operator";

  const result = await mintEmbedToken({ userEmail: email, userName: name });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        missing: result.missing,
        fallback: "same-tab",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    token: result.token,
    iframeUrl: result.iframeUrl,
    expiresIn: result.expiresIn,
    endOrgId: result.endOrgId,
  });
}
