import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentence Rewriter - Rephrase & Improve Your Sentences",
  description: "Free AI sentence rewriter to rephrase and improve your writing. Make sentences clearer, more professional, and engaging. Perfect for emails, essays, and documents.",
  keywords: [
    "sentence rewriter",
    "rephrase my sentence",
    "sentence improver",
    "reword sentence",
    "paraphrase tool",
    "sentence rephraser",
    "improve my sentence",
    "polish my writing",
  ],
  openGraph: {
    title: "Sentence Rewriter - Rephrase & Improve Your Sentences",
    description: "Free AI sentence rewriter to rephrase and improve your writing instantly.",
    url: "https://betterenglish.io/sentence-rewriter",
  },
  twitter: {
    title: "Sentence Rewriter - Rephrase & Improve Your Sentences",
    description: "Free AI sentence rewriter to rephrase and improve your writing instantly.",
  },
  alternates: {
    canonical: "https://betterenglish.io/sentence-rewriter",
  },
};

export default function SentenceRewriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
