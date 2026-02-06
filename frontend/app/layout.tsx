import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vesting Buddy - Stop Leaving Money on the Table",
  description:
    "Your AI-powered personal CFO for employee benefits. Optimize your 401(k) match, HSA/FSA, and stop losing money to poor benefits management.",
  keywords: [
    "401k",
    "employee benefits",
    "HSA",
    "FSA",
    "financial optimization",
    "vesting",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${urbanist.variable} font-sans antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
