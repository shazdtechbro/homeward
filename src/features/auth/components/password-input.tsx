"use client";

import { useState } from "react";
import { cn } from "@/ui/cn";
import { inputClass } from "@/ui/field";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & { showStrength?: boolean };

function strength(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) || /[^a-z0-9]/i.test(value)) score++;
  return score;
}

const LABELS = ["Too short", "Weak", "Okay", "Strong", "Very strong"];
const COLOURS = ["bg-error", "bg-coral", "bg-sun", "bg-green", "bg-green"];

export function PasswordInput({ showStrength, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const score = strength(value);

  return (
    <div>
      <div className="relative">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={cn(inputClass, "pr-20", className)}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-1.5 right-1.5 rounded-[10px] px-3 text-[13px] font-semibold text-ink-2 hover:bg-ink/5 hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i < score ? COLOURS[score] : "bg-ink/10")}
              />
            ))}
          </div>
          <span className="w-[84px] text-right text-[12px] font-semibold text-ink-2">{LABELS[score]}</span>
        </div>
      )}
    </div>
  );
}
