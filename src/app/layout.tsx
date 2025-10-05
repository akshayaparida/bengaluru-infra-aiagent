import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bengaluru Infra AI | Smart Civic Reporting",
  description: "AI-powered civic infrastructure reporting with Cerebras LLaMA. Report potholes, streetlights, garbage issues with automated emails and tweets to authorities.",
  manifest: "/manifest.json",
  keywords: ["Bengaluru", "infrastructure", "AI", "civic reporting", "Cerebras", "LLaMA"],
  authors: [{ name: "Bengaluru Infra AI Team" }],
  openGraph: {
    title: "Bengaluru Infra AI",
    description: "Smart civic reporting with AI",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0a84ff",
};

import ServiceWorkerClient from "../components/ServiceWorkerClient";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<body className={`${geistSans.variable} ${geistMono.variable} bg-neutral-950 text-neutral-100 antialiased flex flex-col min-h-screen` }>
        <ServiceWorkerClient />
        {children}
        <Footer />
      </body>
    </html>
  );
}
