"use client";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function TextInput({ value, onChange, onSubmit, isLoading }: TextInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="input-text" className="block text-sm font-medium mb-2 text-foreground/70">
        Enter your text ✍️
      </label>
      <textarea
        id="input-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste or type your text here, then click Improve. e.g., 'I am wanting to know if you can help me with this issue kindly'"
        className="w-full h-40 p-4 rounded-xl border border-card-border bg-card text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
        disabled={isLoading}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-foreground/50">
          Press <kbd className="px-1.5 py-0.5 rounded bg-card-border text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-card-border text-xs">Enter</kbd> to improve
        </span>
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Improving...
            </span>
          ) : (
            "Improve ✨"
          )}
        </button>
      </div>
    </div>
  );
}
