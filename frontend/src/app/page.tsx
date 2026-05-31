"use client";

import dynamic from "next/dynamic";

const LandingInner = dynamic(() => import("@/components/LandingInner"), { ssr: false });

export default function Home() {
  return <LandingInner />;
}
