import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Negotiator (HaggleOS) - Voice AI Procurement System",
  description:
    "Autonomous Voice AI Procurement, Market Research, and Negotiation Platform. Dispatches parallel voice agents to lock in verified wholesale deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
