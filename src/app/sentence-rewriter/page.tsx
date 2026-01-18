"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthButton } from "@/components/AuthButton";
import { TextImprover } from "@/components/TextImprover";
import { useHistory } from "@/supabase/useHistory";
import { useAuth } from "@/supabase/useAuth";
import Link from "next/link";
import { HistoryList } from "@/components/history/HistoryList";
import { Logo } from "@/components/Logo";

export default function SentenceRewriter() {
  const { entries, addEntry, deleteEntry, clearAll } = useHistory();
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
            <Logo size={28} />
            BetterEnglish
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Admin
              </Link>
            )}
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Sentence Rewriter & Improver
          </h1>
          <p className="text-foreground/60 text-lg">
            Rephrase and polish your sentences with AI. Make your writing clearer and more professional.
          </p>
        </div>

        <TextImprover onImproveComplete={addEntry} />

        <div className="mt-12 prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-foreground">Rewrite Sentences Instantly</h2>
          <p className="text-foreground/70">
            Our AI sentence rewriter helps you rephrase and improve your writing. Whether you need
            to make your text more professional, clearer, or just different, paste your sentence
            above and get instant alternatives.
          </p>
          <h3 className="text-lg font-medium text-foreground mt-6">Perfect For</h3>
          <ul className="text-foreground/70 space-y-1">
            <li>Improving email clarity</li>
            <li>Making essays more engaging</li>
            <li>Rephrasing awkward sentences</li>
            <li>Professional document polishing</li>
            <li>Avoiding repetitive language</li>
          </ul>
        </div>
      </main>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <HistoryList
          entries={entries}
          onDelete={deleteEntry}
          onClearAll={clearAll}
        />

        <footer className="mt-16 text-center text-sm text-foreground/40">
          <p>Made by Ethan :)</p>
        </footer>
      </section>
    </div>
  );
}
