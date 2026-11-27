"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { newPickupCode } from "@/core/domain/claim";
import { answerMatches, MAX_CLAIM_ATTEMPTS } from "@/core/domain/listing";
import { KARMA_PER_RETURN } from "@/core/domain/user";
import { getServices } from "@/infra/container";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { currentUser } from "@/lib/session";

const checkRate = createRateLimiter({ limit: 6, windowMs: 60_000 });

export type ClaimState =
  | { status: "idle" }
  | { status: "error"; message: string; attemptsLeft?: number }
  | { status: "verified" };

const claimSchema = z.object({
  itemId: z.string().min(3).max(40),
  answer: z.string().trim().min(2, "Type your answer.").max(200),
});

/**
 * Words first (cheap and explainable). If the words don't line up, Nova judges
 * meaning, but only when the answer still shares some substance with the truth,
 * so a persuasive paragraph can't talk its way past the check.
 */
async function answerIsRight(question: string, expected: string, given: string) {
  if (answerMatches(expected, given)) return true;
  const judge = getServices().judge;
  if (!judge || !answerMatches(expected, given, 0.25)) return false;
  return (await judge.sameMeaning(question, expected, given)) === true;
}

export async function claimItem(_: ClaimState, form: FormData): Promise<ClaimState> {
  const user = await currentUser();
  if (!user) return { status: "error", message: "Sign in to claim this item." };

  const parsed = claimSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid answer." };
  const { itemId, answer } = parsed.data;
  const { items, claims, users } = getServices();

  try {
    checkRate(user.id);
    const listing = await items.get(itemId);
    if (!listing || listing.status === "claimed")
      throw new AppError("not_found", "This item is no longer available.");
    if (listing.finder.userId === user.id)
      throw new AppError("invalid_input", "You found this one, so you can’t claim it.");

    const mine = (await claims.forItem(itemId)).filter((c) => c.claimantId === user.id);
    if (mine.some((c) => c.status === "verified")) return { status: "verified" };
    const failures = mine.filter((c) => c.status === "rejected").length;
    if (failures >= MAX_CLAIM_ATTEMPTS) {
      return {
        status: "error",
        message: "You’ve used all your attempts for this item.",
        attemptsLeft: 0,
      };
    }

    // An ID card is proved by the matric number on the account, not by a question.
    const ownsCard = Boolean(listing.matric && user.matric && listing.matric === user.matric);
    const verified =
      ownsCard || (await answerIsRight(listing.check.question, listing.check.answer, answer));
    await claims.create({
      id: crypto.randomUUID(),
      itemId,
      itemTitle: listing.title,
      claimantId: user.id,
      claimantName: user.name,
      claimantPhone: user.phone,
      claimantEmail: user.email,
      status: verified ? "verified" : "rejected",
      pickupCode: verified ? newPickupCode() : undefined,
      createdAt: new Date(),
    });
    logger.info("claim.attempt", { itemId, verified, attempt: failures + 1 });

    if (!verified) {
      const attemptsLeft = MAX_CLAIM_ATTEMPTS - failures - 1;
      return {
        status: "error",
        message:
          attemptsLeft > 0
            ? "That doesn’t match what the finder wrote."
            : "That doesn’t match, and that was your last attempt.",
        attemptsLeft,
      };
    }

    if (listing.finder.userId && (await users.get(listing.finder.userId))) {
      await claims.addNotice({
        id: crypto.randomUUID(),
        userId: listing.finder.userId,
        kind: "claim-verified",
        text: `${user.name} proved the ${listing.title} is theirs. When you meet, ask for their pickup code before you hand it over.`,
        itemId,
        createdAt: new Date(),
      });
    }
    revalidatePath(`/items/${itemId}`);
    return { status: "verified" };
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("claim.failed", { message: String(error) });
    return {
      status: "error",
      message: error instanceof AppError ? error.message : "Something went wrong. Try again.",
    };
  }
}

export type HandoverState =
  { status: "idle" } | { status: "error"; message: string } | { status: "done"; owner: string };

const handoverSchema = z.object({
  itemId: z.string().min(3).max(40),
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Pickup codes are 4 digits."),
  key: z.string().max(64).optional(),
});

const checkHandoverRate = createRateLimiter({ limit: 8, windowMs: 60_000 });

/**
 * The finder types the owner's pickup code at the meet-up. Only a code issued
 * to a verified claim on this item closes it: wrong person, wrong code, no handover.
 */
export async function confirmHandover(_: HandoverState, form: FormData): Promise<HandoverState> {
  const parsed = handoverSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the code." };
  const { itemId, code, key } = parsed.data;
  const user = await currentUser();
  const { items, users, claims } = getServices();

  try {
    checkHandoverRate(`${itemId}:${user?.id ?? key ?? "anon"}`);
    const listing = await items.get(itemId);
    if (!listing) throw new AppError("not_found", "Item not found.");
    const isFinder =
      (user && listing.finder.userId === user.id) ||
      (key && listing.manageToken && key === listing.manageToken);
    if (!isFinder) throw new AppError("unauthorized", "Only the finder can confirm the handover.");
    if (listing.status === "claimed")
      return { status: "done", owner: listing.returnedTo ?? "its owner" };

    const claim = (await claims.forItem(itemId)).find(
      (c) => c.status === "verified" && c.pickupCode === code,
    );
    if (!claim) {
      logger.warn("handover.wrong_code", { itemId });
      return {
        status: "error",
        message: "That code doesn’t match. Don’t hand it over until it does.",
      };
    }

    await items.markReturned(itemId, claim.claimantName);
    if (listing.finder.userId) await users.addKarma(listing.finder.userId, KARMA_PER_RETURN);
    await claims.addNotice({
      id: crypto.randomUUID(),
      userId: claim.claimantId,
      kind: "returned",
      text: `Your ${listing.title} is back with you. Welcome home!`,
      itemId,
      createdAt: new Date(),
    });
    logger.info("handover.confirmed", { itemId, karma: Boolean(listing.finder.userId) });
    revalidatePath(`/items/${itemId}`);
    revalidatePath("/home");
    return { status: "done", owner: claim.claimantName };
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("handover.failed", { message: String(error) });
    return {
      status: "error",
      message: error instanceof AppError ? error.message : "Something went wrong. Try again.",
    };
  }
}
