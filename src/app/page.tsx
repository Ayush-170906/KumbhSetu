import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { RoleCards } from "@/components/landing/RoleCards";
import { PulseTeaser } from "@/components/landing/PulseTeaser";
import { GoldenPathSection } from "@/components/landing/GoldenPathSection";
import { ScaleSection } from "@/components/landing/ScaleSection";
import { PilotSection } from "@/components/landing/PilotSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex-1 bg-ivory">
      <Nav />
      <Hero />
      <ProblemSection />
      <RoleCards />
      <PulseTeaser />
      <GoldenPathSection />
      <ScaleSection />
      <PilotSection />
      <Footer />
    </div>
  );
}
