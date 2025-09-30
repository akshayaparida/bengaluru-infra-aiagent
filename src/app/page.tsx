"use client";
import dynamic from "next/dynamic";

// Disable SSR for SingleLanding to avoid hydration mismatches in dev
const SingleLandingNoSSR = dynamic(() => import("./(home)/SingleLanding"), { ssr: false });

export default function Home() {
  return <SingleLandingNoSSR />;
}
