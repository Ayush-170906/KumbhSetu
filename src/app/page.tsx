import type { Metadata } from "next";
import { CommonDashboard } from "@/components/home/CommonDashboard";

export const metadata: Metadata = {
  title: "Kumbh Setu — Choose your role",
  description:
    "One connected response platform for the Nashik–Trimbakeshwar Simhastha Kumbh Mela 2027. Sign in as a pilgrim, volunteer or control-room operator.",
};

export default function HomePage() {
  return <CommonDashboard />;
}
