import type { Metadata } from "next";
import Link from "next/link";
import { HomeTopBar } from "@/components/home/HomeTopBar";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PulseTeaser } from "@/components/landing/PulseTeaser";
import { GoldenPathSection } from "@/components/landing/GoldenPathSection";
import { ScaleSection } from "@/components/landing/ScaleSection";
import { PilotSection } from "@/components/landing/PilotSection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Kumbh Setu — How it works",
  description:
    "The problem Kumbh Setu addresses, the connected response loop, the Kumbh Pulse risk layer, why the backbone scales, and the pilot roadmap.",
};

export default function AboutPage() {
  return (
    <div className="flex-1 bg-ivory">
      <HomeTopBar solid />
      <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <Link href="/" className="text-xs font-medium text-primary hover:text-primary-dark">
          ← Back to role selection
        </Link>
      </div>
      <Hero />
      <ProblemSection />
      <PulseTeaser />
      <GoldenPathSection />
      <ScaleSection />
      <PilotSection />
      <Footer />
    </div>
  );
}
