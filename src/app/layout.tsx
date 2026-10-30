import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kumbh Setu — Connected Response Platform",
  description:
    "One connected platform for pilgrims, volunteers and management — a prototype civic-technology system for large public gatherings, powered by the Kumbh Pulse risk layer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ivory text-ink">{children}</body>
    </html>
  );
}
