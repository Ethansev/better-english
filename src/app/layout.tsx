import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import CrispChat from "@/components/CrispChat"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://betterenglish.io'),
  title: {
    default: "BetterEnglish - Improve Your Writing",
    template: "%s | BetterEnglish",
  },
  description: "Free AI writing assistant to improve your English. Fix grammar, rephrase sentences, and polish your writing for emails, essays, and professional documents. Better English made easy.",
  icons: {
    icon: [
      {
        url: '/icon-dark.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-light.svg',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon',
  },
  keywords: [
    "better english",
    "better english app",
    "improve my english writing",
    "AI writing assistant",
    "grammar checker",
    "sentence improver",
    "rephrase my sentence",
    "fix my english",
    "professional writing tool",
    "english writing helper",
    "polish my writing",
    "make my writing sound professional",
    "ESL writing help",
  ],
  authors: [{ name: "BetterEnglish" }],
  creator: "BetterEnglish",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://betterenglish.io",
    siteName: "BetterEnglish",
    title: "BetterEnglish - Free AI Writing Assistant",
    description: "Improve your English writing instantly. Fix grammar, rephrase sentences, and polish your writing for free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BetterEnglish - Free AI Writing Assistant",
    description: "Improve your English writing instantly. Fix grammar, rephrase sentences, and polish your writing for free.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "BetterEnglish",
              "alternateName": "Better English App",
              "description": "Free AI writing assistant to improve your English. Fix grammar, rephrase sentences, and polish your writing for emails, essays, and professional documents.",
              "url": "https://betterenglish.io",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "keywords": "better english, grammar checker, AI writing assistant, sentence improver, professional writing",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CrispChat />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
