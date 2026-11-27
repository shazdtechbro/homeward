"use client";

import { Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { splitByEvidence } from "@/features/ai-demo/highlight";
import { Arrow, Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { ItemPhoto } from "@/ui/item-photo";
import { searchLost, type LostSearchResult } from "../actions";

const EXAMPLES = [
  "Black HP laptop with a sticker, left at the main library last night",
  "My Casio calculator don loss for CBT centre this morning",
  "Navy backpack near Faculty of Arts yesterday",
  "Lost my student ID card",
];

export function LostSearch() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [state, setState] = useState<LostSearchResult | null>(null);
  const [pending, startTransition] = useTransition();

  function run(query: string) {
    setText(query);
    setSubmitted(query);
    startTransition(async () => setState(await searchLost(query)));
  }

  const result = state?.ok ? state.result : undefined;
  const evidence = result?.fields.map((f) => f.evidence) ?? [];

  return (
    <section aria-labelledby="lost-title">
      <p className="text-[13px] font-bold tracking-[0.14em] text-coral uppercase">Homeward AI</p>
      <h1
        id="lost-title"
        className="mt-3 max-w-[760px] font-display-tight text-[44px] sm:text-[64px]"
      >
        Say what you lost. <em className="font-normal italic">We’ll do the looking.</em>
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text);
        }}
        className="mt-8 rounded-[28px] bg-white p-3 shadow-soft ring-1 ring-ink/5 sm:p-4"
      >
        <label htmlFor="lost-text" className="sr-only">
          Describe what you lost
        </label>
        <textarea
          id="lost-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(text);
            }
          }}
          rows={2}
          maxLength={280}
          placeholder="Describe it like you’d tell a friend: what, where, when…"
          className="block w-full resize-none bg-transparent px-2 py-2 text-[18px] outline-none placeholder:text-ink-2/60 sm:text-[20px]"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="pl-2 text-[12px] text-ink-2">{text.length}/280</span>
          <Button type="submit" variant="coral" disabled={pending || text.trim().length < 8}>
            {pending ? "Searching…" : "Search campus"} {!pending && <Arrow />}
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => run(example)}
            className="rounded-full border border-ink/10 bg-white/70 px-3.5 py-2 text-left text-[13px] font-medium text-ink-2 hover:border-ink/30 hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-10">
        <AnimatePresence mode="wait">
          {pending && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-ink-2"
            >
              <span className="relative grid size-10 place-items-center">
                <span className="absolute inset-0 animate-radar-ping rounded-full bg-coral/30" />
                <span className="size-3 rounded-full bg-coral" />
              </span>
              Reading your description and scanning every find on campus…
            </motion.div>
          )}

          {!pending && state && !state.ok && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[16px] bg-error/10 px-4 py-3 font-medium text-error"
            >
              {state.message}
            </motion.p>
          )}

          {!pending && result && state?.ok && (
            <motion.div
              key={submitted}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="rounded-[24px] bg-sky/30 p-5">
                <p className="text-[13px] font-bold tracking-[0.1em] text-green uppercase">
                  What we understood
                </p>
                <p className="mt-2 text-[17px] leading-relaxed">
                  {splitByEvidence(submitted, evidence).map((part, i) =>
                    part.highlighted ? (
                      <mark key={i} className="rounded-md bg-sun px-1 text-ink">
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.fields.map((field) => (
                    <span
                      key={field.label}
                      className="rounded-full bg-white px-3 py-1.5 text-[13px]"
                    >
                      <span className="text-ink-2">{field.label}</span> <b>{field.value}</b>
                    </span>
                  ))}
                  <span className="rounded-full bg-ink px-3 py-1.5 font-mono text-[12px] text-paper">
                    {result.scanned} finds scanned
                  </span>
                </div>
              </div>

              {result.outcome.kind === "matches" && (
                <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                  {result.outcome.matches.map((match, i) => (
                    <motion.li
                      key={match.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link
                        href={`/items/${match.id}`}
                        className="group block overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-ink/5 transition hover:-translate-y-1"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <ItemPhoto
                            imageKey={match.imageKey}
                            alt={match.title}
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="size-full"
                            imgClassName="transition duration-500 group-hover:scale-105"
                          />
                          <span
                            className={cn(
                              "absolute top-3 left-3 rounded-full px-3 py-1 font-mono text-[13px] font-semibold",
                              i === 0 ? "bg-coral text-ink" : "bg-white text-ink",
                            )}
                          >
                            {match.score}% match
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold">{match.title}</p>
                          <p className="mt-1 text-[14px] text-ink-2">
                            {match.place} · {match.when}
                          </p>
                          <p className="mt-3 text-[14px] font-semibold text-green">
                            Is this yours? →
                          </p>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}

              {result.outcome.kind === "private" && (
                <div className="mt-6 rounded-[24px] bg-green p-6 text-paper">
                  <p className="flex items-center gap-2 text-[20px] font-semibold">
                    <Lock aria-hidden className="size-5" /> ID cards are matched privately.
                  </p>
                  {state.privateMatchId ? (
                    <>
                      <p className="mt-2 text-paper/85">
                        Good news: a card with your matric number has been handed in.
                      </p>
                      <Link
                        href={`/items/${state.privateMatchId}`}
                        className="mt-4 inline-flex rounded-full bg-sun px-5 py-3 font-semibold text-ink"
                      >
                        See your card →
                      </Link>
                    </>
                  ) : state.hasMatric ? (
                    <p className="mt-2 text-paper/85">
                      No card with your matric number yet. The moment one is logged, you’ll see it
                      in your inbox.
                    </p>
                  ) : (
                    <p className="mt-2 text-paper/85">
                      We never list ID cards publicly.{" "}
                      <Link href="/sign-up?next=/lost" className="font-semibold underline">
                        Create an account with your matric number
                      </Link>{" "}
                      and we’ll tell you, and only you, when it turns up.
                    </p>
                  )}
                </div>
              )}

              {result.outcome.kind === "none" && (
                <div className="mt-6 rounded-[24px] bg-white p-6 shadow-soft">
                  <p className="text-[20px] font-semibold">
                    Nothing like it has been handed in yet.
                  </p>
                  <p className="mt-2 text-ink-2">
                    Things turn up for days after they go missing. Try again later, or add more
                    detail: colour, brand, where you last had it.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
