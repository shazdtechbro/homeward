"use client";

import { ArrowUp, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SearchResponse } from "@/features/ai-demo/schema";
import { cn } from "@/ui/cn";
import { ItemPhoto } from "@/ui/item-photo";
import type { AssistantEvent } from "../schema";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: SearchResponse;
  privateMatchId?: string;
  hasMatric?: boolean;
  streaming?: boolean;
};

const INTRO: Message = {
  id: "intro",
  role: "assistant",
  content:
    "Hey 👋 I'm Homeward AI. Lost something? Don't panic, it happens to everyone. Tell me what it is, where you last had it and when, and I'll search every find on campus for you.",
};

const STARTERS = [
  "I lost my navy laptop backpack at engineering yesterday",
  "My Casio calculator don loss for CBT centre",
  "Black Tecno phone, left it on the shuttle",
  "I can't find my student ID card",
];

const newId = () => Math.random().toString(36).slice(2);

function Avatar() {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-green text-paper shadow-soft"
    >
      <svg viewBox="0 0 32 32" className="size-5 fill-current">
        <path d="M9 15.5 16 9.5l7 6V23a1 1 0 0 1-1 1h-3.5v-4.5h-5V24H10a1 1 0 0 1-1-1z" />
      </svg>
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Homeward AI is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-ink/40"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function Understood({ result }: { result: SearchResponse }) {
  if (result.fields.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {result.fields.map((f) => (
        <span key={f.label} className="rounded-full bg-sky/40 px-2.5 py-1 text-[12px]">
          <span className="text-ink-2">{f.label}</span> <b className="font-semibold">{f.value}</b>
        </span>
      ))}
      <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] text-paper">
        {result.scanned} finds searched
      </span>
    </div>
  );
}

function Matches({ message }: { message: Message }) {
  const result = message.result;
  if (!result) return null;

  if (result.outcome.kind === "matches") {
    return (
      <ul className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {result.outcome.matches.map((match, i) => (
          <motion.li
            key={match.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="w-[200px] shrink-0 snap-start"
          >
            <Link
              href={`/items/${match.id}`}
              className="group block overflow-hidden rounded-[18px] bg-white ring-1 ring-ink/8 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                <ItemPhoto
                  imageKey={match.imageKey}
                  alt={match.title}
                  sizes="200px"
                  className="size-full"
                  imgClassName="transition duration-500 group-hover:scale-105"
                />
                <span
                  className={cn(
                    "absolute top-2 left-2 rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold",
                    i === 0 ? "bg-coral text-ink" : "bg-white text-ink",
                  )}
                >
                  {match.score}%
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-[14px] font-semibold">{match.title}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-2">
                  {match.place} · {match.when}
                </p>
                <p className="mt-2 text-[13px] font-semibold text-green">Is this yours? →</p>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    );
  }

  if (result.outcome.kind === "private") {
    return message.privateMatchId ? (
      <Link
        href={`/items/${message.privateMatchId}`}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2.5 text-[14px] font-semibold"
      >
        See your card →
      </Link>
    ) : message.hasMatric ? null : (
      <Link
        href="/sign-up?next=/lost"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-green px-4 py-2.5 text-[14px] font-semibold text-paper"
      >
        <Lock aria-hidden className="size-4" /> Add my matric number
      </Link>
    );
  }
  return null;
}

/** Conversational lost-item search: the AI listens, searches and answers in the chat. */
export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const update = (id: string, patch: Partial<Message> | ((m: Message) => Partial<Message>)) =>
    setMessages((all) =>
      all.map((m) =>
        m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m,
      ),
    );

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setQuickReplies([]);
    setBusy(true);

    const user: Message = { id: newId(), role: "user", content };
    const reply: Message = { id: newId(), role: "assistant", content: "", streaming: true };
    const history = [...messages, user].filter((m) => m.id !== "intro");
    setMessages((all) => [...all, user, reply]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? "Something went wrong.");
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AssistantEvent;
          if (event.type === "result") {
            update(reply.id, {
              result: event.result,
              privateMatchId: event.privateMatchId,
              hasMatric: event.hasMatric,
            });
          } else if (event.type === "token") {
            update(reply.id, (m) => ({ content: m.content + event.text }));
          } else if (event.type === "suggestions") {
            setQuickReplies(event.items);
          }
        }
      }
    } catch (error) {
      update(reply.id, {
        content: `Sorry, I couldn't search just now 😕 ${error instanceof Error ? error.message : ""} Try again in a moment.`,
      });
    } finally {
      update(reply.id, { streaming: false });
      setBusy(false);
    }
  }

  const started = messages.length > 1;

  return (
    <section
      aria-label="Homeward AI assistant"
      className="flex h-[min(78dvh,720px)] flex-col overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-ink/5"
    >
      <header className="flex items-center gap-3 border-b border-ink/5 px-5 py-3.5">
        <Avatar />
        <div>
          <p className="text-[15px] font-semibold">Homeward AI</p>
          <p className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="size-2 rounded-full bg-success" aria-hidden /> Online · searches every
            find on campus
          </p>
        </div>
      </header>

      <div
        ref={scroller}
        className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-2.5", m.role === "user" && "justify-end")}
            >
              {m.role === "assistant" && <Avatar />}
              <div className={cn("max-w-[85%]", m.role === "assistant" && "min-w-0 flex-1")}>
                <div
                  className={cn(
                    "inline-block rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-ink text-paper"
                      : "rounded-bl-md bg-paper-2 text-ink",
                  )}
                >
                  {m.content ? (
                    <>
                      {m.content}
                      {m.streaming && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-caret bg-ink align-[-2px]" />
                      )}
                    </>
                  ) : (
                    <TypingDots />
                  )}
                </div>
                {m.result && <Understood result={m.result} />}
                <Matches message={m} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-ink/5 p-3 sm:p-4">
        {(!started || quickReplies.length > 0) && !busy && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {(started ? quickReplies : STARTERS).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="shrink-0 rounded-full border border-ink/10 bg-paper px-3.5 py-2 text-[13px] font-medium text-ink-2 transition hover:border-ink/30 hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-[22px] bg-paper px-3 py-2 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-sun"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Message Homeward AI
          </label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={400}
            placeholder={started ? "Reply to Homeward AI…" : "What did you lose?"}
            className="max-h-28 flex-1 resize-none bg-transparent px-1 py-2 text-[16px] outline-none placeholder:text-ink-2/60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-coral text-ink transition disabled:opacity-40"
          >
            <ArrowUp aria-hidden className="size-5" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </section>
  );
}
