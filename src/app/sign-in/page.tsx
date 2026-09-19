import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Google, GitHub, or email — then investigate your workspace."
      footer={
        <>
          No account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-ink underline-offset-4 hover:underline"
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
