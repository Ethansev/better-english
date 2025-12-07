"use client";

export type Tone = "casual" | "formal";

interface ToneSliderProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

export function ToneSlider({ value, onChange }: ToneSliderProps) {
  const isFormal = value === "formal";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm font-medium transition-colors ${
          !isFormal ? "text-foreground" : "text-foreground/50"
        }`}
      >
        Casual
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isFormal}
        onClick={() => onChange(isFormal ? "casual" : "formal")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer ${
          isFormal
            ? "bg-blue-500"
            : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isFormal ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          isFormal ? "text-foreground" : "text-foreground/50"
        }`}
      >
        Formal
      </span>
    </div>
  );
}
