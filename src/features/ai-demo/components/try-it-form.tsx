"use client";

import { useId, useState } from "react";
import { Arrow, Button } from "@/ui/button";
import { searchRequestSchema } from "../schema";

const SUGGESTIONS = [
  "Lost my keys near the Senate Building today",
  "Black Tecno phone at Shuttle Park",
  "Casio calculator in the library this morning",
];

type TryItFormProps = {
  onSearch: (text: string) => void;
  error: string | null;
  onReplay?: () => void;
};

export function TryItForm({ onSearch, error, onReplay }: TryItFormProps) {
  const inputId = useId();
  const errorId = useId();
  const [text, setText] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const message = validation ?? error;

  function submit(value: string) {
    const parsed = searchRequestSchema.safeParse({ text: value });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? "Try describing it differently.");
      return;
    }
    setValidation(null);
    onSearch(parsed.data.text);
  }

  return (
    <div className="mx-auto mt-10 max-w-[720px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(text);
        }}
      >
        <label htmlFor={inputId} className="block text-center text-[15px] font-semibold text-ink-2">
          Try it yourself
        </label>
        <div className="mt-3 flex flex-col gap-2 rounded-[28px] bg-white p-2 shadow-soft ring-1 ring-ink/8 focus-within:ring-2 focus-within:ring-coral/60 sm:flex-row sm:rounded-full">
          <input
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={280}
            autoComplete="off"
            placeholder="Describe what you lost, where and when"
            aria-invalid={Boolean(message)}
            aria-describedby={message ? errorId : undefined}
            className="h-12 flex-1 rounded-full bg-transparent px-4 text-[17px] font-medium outline-none placeholder:text-ink-2/60"
          />
          <Button type="submit" size="md" className="h-12">
            Find it <Arrow />
          </Button>
        </div>
      </form>

      <p id={errorId} role="alert" className="mt-3 min-h-6 text-center text-[14px] font-medium text-error">
        {message}
      </p>

      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setText(suggestion);
              submit(suggestion);
            }}
            className="rounded-full bg-paper-2 px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-sky/40 hover:text-ink"
          >
            {suggestion}
          </button>
        ))}
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-coral underline-offset-4 hover:underline"
          >
            ↺ Replay the demo
          </button>
        )}
      </div>
    </div>
  );
}
