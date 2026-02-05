import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Vesting Buddy - Stop Leaving Money on the Table",
  description: "Your AI-powered personal CFO for employee benefits. Optimize your 401(k) match, HSA/FSA, and stop losing money to poor benefits management.",
  keywords: ["401k", "employee benefits", "HSA", "FSA", "financial optimization", "vesting"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html           className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}    lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              const theme = localStorage.getItem('theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })();
          `}
        </Script>
      </head>
      <body
          className={`min-h-dvh`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
