"use client";

import dynamic from "next/dynamic";

const HeroScene = dynamic(
  () => import("@/components/hero-scene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-teal-soft/40 to-transparent" />
    ),
  },
);

export function LandingHeroCanvas() {
  return <HeroScene />;
}
