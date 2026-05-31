"use client";

import dynamic from "next/dynamic";

const DashboardInner = dynamic(() => import("@/components/DashboardInner"), { ssr: false });

export default function DashboardPage() {
  return <DashboardInner />;
}
