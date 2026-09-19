import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Access Privy investigations for your workspace."
      footer={
        <>
          No account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
