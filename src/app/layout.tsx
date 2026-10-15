import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE NEGOTIATOR // Voice AI Procurement Engine",
  description:
    "Autonomous Voice AI Procurement, Market Research, and Negotiation Platform. Dispatches parallel voice agents to lock in verified wholesale deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#fbf8f3] text-black antialiased selection:bg-[#bef264] selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
