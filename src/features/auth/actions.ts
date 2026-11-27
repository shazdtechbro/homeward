"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normaliseMatric } from "@/core/domain/user";
import { getServices } from "@/infra/container";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { endSession, startSession } from "@/lib/session";
import { echo, fieldErrors, safeNext, signInSchema, signUpSchema, type FormState } from "./schema";

const checkRate = createRateLimiter({ limit: 10, windowMs: 60_000 });

async function rateLimit(scope: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  checkRate(`${scope}:${ip}`);
}

const message = (error: unknown) =>
  error instanceof AppError ? error.message : "Something went wrong on our side. Try again.";

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const values = echo(form, "email");
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  try {
    await rateLimit("sign-in");
    const user = await getServices().users.byEmail(parsed.data.email);
    // Same message either way, so the form can't be used to discover accounts.
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return { error: "That email and password don’t match.", values };
    }
    await startSession(user.id);
    logger.info("auth.sign_in", { userId: user.id });
  } catch (error) {
    if (!(error instanceof AppError))
      logger.error("auth.sign_in_failed", { message: String(error) });
    return { error: message(error), values };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const values = echo(form, "name", "email", "phone", "matric", "faculty");
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { password, matric, ...profile } = parsed.data;
  const { users } = getServices();

  try {
    await rateLimit("sign-up");
    if (await users.byEmail(profile.email))
      return {
        fieldErrors: { email: "That email already has an account. Sign in instead." },
        values,
      };
    const normalisedMatric = matric ? normaliseMatric(matric) : undefined;
    if (normalisedMatric && (await users.byMatric(normalisedMatric))) {
      return { fieldErrors: { matric: "That matric number is already registered." }, values };
    }

    const id = `usr_${crypto.randomUUID().slice(0, 12)}`;
    await users.create({
      id,
      ...profile,
      matric: normalisedMatric,
      passwordHash: await bcrypt.hash(password, 10),
      karma: 0,
      createdAt: new Date(),
    });
    await startSession(id);
    logger.info("auth.sign_up", { userId: id, withMatric: Boolean(normalisedMatric) });
  } catch (error) {
    if (!(error instanceof AppError))
      logger.error("auth.sign_up_failed", { message: String(error) });
    return { error: message(error), values };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await endSession();
  redirect("/");
}
