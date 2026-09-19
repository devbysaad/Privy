import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Source_Sans_3, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Privy",
  description:
    "Who has access to what, and does that access still make sense?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      signInForceRedirectUrl="/onboarding"
      signUpForceRedirectUrl="/onboarding"
      appearance={{
        variables: {
          colorPrimary: "#0f172a",
          borderRadius: "0.625rem",
        },
        captcha: {
          theme: "light",
          size: "flexible",
          language: "en-US",
        },
      }}
    >
      <html
        lang="en"
        className={`${syne.variable} ${sourceSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col font-sans">
          {/* Single CAPTCHA mount for all Clerk custom / component flows */}
          <div
            id="clerk-captcha"
            data-cl-theme="light"
            data-cl-size="flexible"
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
