"use client";

import { Check, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Arrow, Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Field, FormError, inputClass } from "@/ui/field";
import { signUp } from "../actions";
import { FACULTIES } from "../faculties";
import type { FormState } from "../schema";
import { PasswordInput } from "./password-input";

const STEP_ONE_FIELDS = new Set(["name", "email", "password"]);

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  // A server error on a step-one field sends you back to fix it.
  const stepOneError = Object.keys(errors).some((k) => STEP_ONE_FIELDS.has(k));
  const shown = stepOneError ? 1 : step;

  function goToDetails() {
    const form = formRef.current;
    if (!form) return;
    const required = ["name", "email", "password"].map((n) => form.elements.namedItem(n) as HTMLInputElement);
    const firstInvalid = required.find((input) => !input.checkValidity());
    if (firstInvalid) {
      firstInvalid.reportValidity();
      return;
    }
    setFirstName(required[0]!.value.trim().split(/\s+/)[0] ?? "");
    setStep(2);
  }

  return (
    <div>
      <ol aria-label="Sign-up progress" className="flex items-center gap-2 text-[13px] font-semibold">
        {["Your account", "Find things faster"].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full text-[12px] transition-colors",
                shown > i ? "bg-ink text-paper" : "bg-ink/10 text-ink-2",
              )}
              aria-current={shown === i + 1 ? "step" : undefined}
            >
              {shown > i + 1 ? <Check aria-hidden className="size-3.5" /> : i + 1}
            </span>
            <span className={shown === i + 1 ? "text-ink" : "text-ink-2"}>{label}</span>
            {i === 0 && <span aria-hidden className="mx-1 h-px w-6 bg-ink/15" />}
          </li>
        ))}
      </ol>

      <form ref={formRef} action={action} className="mt-8" noValidate={shown === 2}>
        <input type="hidden" name="next" value={next ?? ""} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={shown}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            {shown === 1 ? (
              <h1 className="font-display-tight text-[42px] sm:text-[52px]">
                Join the campus that <em className="font-normal italic">returns</em> things.
              </h1>
            ) : (
              <h1 className="font-display-tight text-[42px] sm:text-[52px]">
                One more thing, <em className="font-normal italic">{firstName || (values.name ?? "").split(" ")[0] || "friend"}</em>.
              </h1>
            )}
            <p className="mt-4 text-[16px] text-ink-2">
              {shown === 1
                ? "Takes 30 seconds. You’ll be able to report lost items, log finds and earn karma."
                : "These help us reach you the moment something of yours turns up. Skip any you like."}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 space-y-5">
          <FormError message={state.error} />

          <div className={cn("space-y-5", shown !== 1 && "hidden")}>
            <Field label="Full name" error={errors.name}>
              {(a11y) => <input {...a11y} name="name" autoComplete="name" placeholder="Aisha Bello" defaultValue={values.name} className={inputClass} required minLength={2} />}
            </Field>
            <Field label="Email" error={errors.email}>
              {(a11y) => <input {...a11y} name="email" type="email" autoComplete="email" placeholder="you@students.unilorin.edu.ng" defaultValue={values.email} className={inputClass} required />}
            </Field>
            <Field label="Password" error={errors.password}>
              {(a11y) => <PasswordInput {...a11y} name="password" autoComplete="new-password" placeholder="At least 8 characters" showStrength required minLength={8} />}
            </Field>
            <Button type="button" size="lg" className="w-full" onClick={goToDetails}>
              Continue <Arrow />
            </Button>
          </div>

          <div className={cn("space-y-5", shown !== 2 && "hidden")}>
            <Field label="Matric number" optional error={errors.matric} hint={<><Lock aria-hidden className="inline size-4 align-[-3px]" /> If your ID card is ever handed in, only <b>you</b> get told. It’s never shown publicly.</>}>
              {(a11y) => <input {...a11y} name="matric" placeholder="19/52HA041" autoCapitalize="characters" defaultValue={values.matric} className={cn(inputClass, "font-mono uppercase")} />}
            </Field>
            <Field label="Phone or WhatsApp" optional error={errors.phone} hint="Shared only with someone who has proved an item is theirs.">
              {(a11y) => <input {...a11y} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" defaultValue={values.phone} className={inputClass} />}
            </Field>
            <Field label="Faculty" optional error={errors.faculty}>
              {(a11y) => (
                <select {...a11y} name="faculty" defaultValue={values.faculty ?? ""} className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%23141412%22 stroke-width=%221.6%22/></svg>')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10")}>
                  <option value="">Choose your faculty</option>
                  {FACULTIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              )}
            </Field>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="ghost" size="lg" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" size="lg" variant="coral" className="flex-1" disabled={pending}>
                {pending ? "Creating your account…" : "Create account"} {!pending && <Arrow />}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <p className="mt-7 text-center text-[15px] text-ink-2">
        Already have an account?{" "}
        <Link href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"} className="font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
