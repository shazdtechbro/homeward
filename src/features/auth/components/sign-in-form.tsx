"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Arrow, Button } from "@/ui/button";
import { Field, FormError, inputClass } from "@/ui/field";
import { signIn } from "../actions";
import type { FormState } from "../schema";
import { PasswordInput } from "./password-input";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  const errors = state.fieldErrors ?? {};

  return (
    <div>
      <p className="text-[13px] font-bold tracking-[0.14em] text-coral uppercase">Welcome back</p>
      <h1 className="mt-3 font-display-tight text-[44px] sm:text-[56px]">
        Let’s get your <em className="font-normal italic">things</em> home.
      </h1>
      <p className="mt-4 text-[16px] text-ink-2">
        Sign in to report something lost, track your finds and see who’s claimed them.
      </p>

      <form action={action} className="mt-9 space-y-5" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <FormError message={state.error} />
        <Field label="Email" error={errors.email}>
          {(a11y) => (
            <input
              {...a11y}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@students.unilorin.edu.ng"
              defaultValue={state.values?.email}
              className={inputClass}
              required
            />
          )}
        </Field>
        <Field label="Password" error={errors.password}>
          {(a11y) => (
            <PasswordInput
              {...a11y}
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"} {!pending && <Arrow />}
        </Button>
      </form>

      <p className="mt-7 text-center text-[15px] text-ink-2">
        New to Homeward?{" "}
        <Link
          href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          className="font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
