"use client";

import { CircleCheck, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Arrow, Button } from "@/ui/button";
import { Confetti } from "@/ui/confetti";
import { confirmHandover, type HandoverState } from "../actions";

/** The finder's side of the meet-up: type the owner's code, then hand it over. */
export function HandoverForm({
  itemId,
  manageKey,
  ownerFirstName,
}: {
  itemId: string;
  manageKey?: string;
  ownerFirstName: string;
}) {
  const [state, action, pending] = useActionState<HandoverState, FormData>(confirmHandover, {
    status: "idle",
  });

  if (state.status === "done") {
    return (
      <div className="relative overflow-hidden rounded-[24px] bg-green p-6 text-paper">
        <Confetti />
        <p className="flex items-center gap-2 text-[22px] font-semibold">
          <CircleCheck aria-hidden className="size-6 text-sun" /> Code matched. Hand it over.
        </p>
        <p className="mt-1 text-paper/85">
          It’s marked as returned to {state.owner}, and +50 karma is on your profile. Thank you.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-ink/5">
      <input type="hidden" name="itemId" value={itemId} />
      {manageKey && <input type="hidden" name="key" value={manageKey} />}
      <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.12em] text-coral uppercase">
        <KeyRound aria-hidden className="size-4" /> At the meet-up
      </p>
      <label htmlFor="pickup-code" className="mt-2 block text-[20px] font-semibold">
        Ask {ownerFirstName} for their pickup code
      </label>
      <p className="mt-1 text-[14px] text-ink-2">
        Only hand the item over once the code matches. It proves you’re giving it to the person who
        proved it’s theirs.
      </p>
      <input
        id="pickup-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{4}"
        maxLength={4}
        required
        placeholder="0000"
        className="mt-4 block w-full rounded-[16px] border border-ink/12 bg-paper px-4 py-4 text-center font-mono text-[32px] tracking-[0.5em] outline-none focus:border-ink/40 focus:ring-4 focus:ring-sun/40"
      />
      {state.status === "error" && (
        <p
          role="alert"
          className="mt-3 rounded-[12px] bg-error/10 px-3 py-2 text-[14px] font-medium text-error"
        >
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" variant="coral" className="mt-4 w-full" disabled={pending}>
        {pending ? "Checking…" : "Confirm handover"} {!pending && <Arrow />}
      </Button>
    </form>
  );
}
