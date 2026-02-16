import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "五子棋在线对战",
  description: "经典五子棋游戏，支持人机对战和在线双人对战",
  keywords: ["五子棋", "Gomoku", "在线游戏", "人机对战", "双人对战"],
  authors: [{ name: "Gomoku Game" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "五子棋在线对战",
    description: "经典五子棋游戏，支持人机对战和在线双人对战",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
