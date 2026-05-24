"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthButton } from "@/components/AuthButton";
import { TextImprover } from "@/components/TextImprover";
import { useHistory } from "@/auth/useHistory";
import { useAuth } from "@/auth/useAuth";
import Link from "next/link";
import { HistoryList } from "@/components/history/HistoryList";
import { Logo } from "@/components/Logo";

export default function GrammarChecker() {
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
            Free Grammar Checker
          </h1>
          <p className="text-foreground/60 text-lg">
            Fix grammar mistakes instantly with AI. Paste your text to check and correct errors.
          </p>
        </div>

        <TextImprover onImproveComplete={addEntry} />

        <div className="mt-12 prose prose-gray dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-foreground">How Our Grammar Checker Works</h2>
          <p className="text-foreground/70">
            Our AI-powered grammar checker analyzes your text for common grammar mistakes,
            punctuation errors, and awkward phrasing. Simply paste your text above and get
            instant corrections. Perfect for emails, essays, and professional documents.
          </p>
          <h3 className="text-lg font-medium text-foreground mt-6">What We Check</h3>
          <ul className="text-foreground/70 space-y-1">
            <li>Subject-verb agreement</li>
            <li>Punctuation and comma usage</li>
            <li>Spelling mistakes</li>
            <li>Sentence structure</li>
            <li>Word choice and clarity</li>
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
