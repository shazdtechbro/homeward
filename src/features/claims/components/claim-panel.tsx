"use client";

import { ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useActionState } from "react";
import { Arrow, Button } from "@/ui/button";
import { inputClass } from "@/ui/field";
import { claimItem, type ClaimState } from "../actions";

type ClaimPanelProps = {
  itemId: string;
  question: string;
  signedIn: boolean;
  attemptsLeft: number;
  /** ID cards: the matric on the account already proves it. */
  matricProof?: boolean;
};

export function ClaimPanel({
  itemId,
  question,
  signedIn,
  attemptsLeft,
  matricProof,
}: ClaimPanelProps) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimItem, {
    status: "idle",
  });
  const left =
    state.status === "error" && state.attemptsLeft !== undefined
      ? state.attemptsLeft
      : attemptsLeft;

  if (!signedIn) {
    return (
      <div className="rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-ink/5">
        <p className="text-[20px] font-semibold">Is this yours?</p>
        <p className="mt-2 text-ink-2">
          Sign in to answer the finder’s question. It takes 30 seconds, and it keeps your item safe
          from people who’d just like a free laptop.
        </p>
        <Link
          href={`/sign-in?next=/items/${itemId}`}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-paper"
        >
          Sign in to claim <Arrow />
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {state.status === "verified" ? (
        <motion.div
          key="ok"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[24px] bg-sun p-6"
        >
          <p className="flex items-center gap-2 text-[22px] font-semibold">
            <ShieldCheck aria-hidden className="size-6" /> Ownership proved
          </p>
          <p className="mt-1 text-ink/80">Loading the finder’s contact…</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={action}
          className="rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-ink/5"
          exit={{ opacity: 0 }}
        >
          <input type="hidden" name="itemId" value={itemId} />
          <p className="text-[13px] font-bold tracking-[0.12em] text-coral uppercase">
            Prove it’s yours
          </p>
          {matricProof ? (
            <>
              <p className="mt-2 text-[20px] font-semibold">
                This card carries your matric number.
              </p>
              <input type="hidden" name="answer" value="matric" />
            </>
          ) : (
            <>
              <label htmlFor="claim-answer" className="mt-2 block text-[20px] font-semibold">
                {question}
              </label>
              <input
                id="claim-answer"
                name="answer"
                required
                minLength={2}
                maxLength={200}
                placeholder="Your answer"
                className={`${inputClass} mt-4`}
                autoComplete="off"
              />
              <p className="mt-2 text-[13px] text-ink-2">
                Our AI allows for different wording. {left} {left === 1 ? "attempt" : "attempts"}{" "}
                left.
              </p>
            </>
          )}
          {state.status === "error" && (
            <p
              role="alert"
              className="mt-3 rounded-[12px] bg-error/10 px-3 py-2 text-[14px] font-medium text-error"
            >
              {state.message}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            variant="coral"
            className="mt-5 w-full"
            disabled={pending || left <= 0}
          >
            {pending ? "Checking…" : matricProof ? "Claim my card" : "Check my answer"}{" "}
            {!pending && <Arrow />}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
