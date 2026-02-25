import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HerSecure | Women's Safety Platform",
  description: "HerSecure — AI-powered safety platform for women with real-time SOS alerts, live tracking, and GuardianAI.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-slate-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
