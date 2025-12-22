import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Grammar Checker - Fix Grammar Mistakes Instantly",
  description: "Check and fix grammar mistakes for free with our AI-powered grammar checker. Correct punctuation, spelling, and sentence structure in seconds. No signup required.",
  keywords: [
    "grammar checker",
    "fix grammar",
    "grammar checker online",
    "free grammar checker",
    "check my grammar",
    "grammar correction",
    "punctuation checker",
    "spelling checker",
  ],
  openGraph: {
    title: "Free Grammar Checker - Fix Grammar Mistakes Instantly",
    description: "Check and fix grammar mistakes for free with our AI-powered grammar checker.",
    url: "https://betterenglish.io/grammar-checker",
  },
  twitter: {
    title: "Free Grammar Checker - Fix Grammar Mistakes Instantly",
    description: "Check and fix grammar mistakes for free with our AI-powered grammar checker.",
  },
  alternates: {
    canonical: "https://betterenglish.io/grammar-checker",
  },
};

export default function GrammarCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
