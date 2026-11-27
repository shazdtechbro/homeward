"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PLACES } from "@/core/domain/campus-places";
import { listingText, type Listing } from "@/core/domain/listing";
import { normaliseMatric } from "@/core/domain/user";
import type { ImageAnalysis } from "@/core/ports";
import { fieldErrors, type FormState } from "@/features/auth/schema";
import { getServices } from "@/infra/container";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { currentUser } from "@/lib/session";
import { foundItemSchema, MAX_PHOTO_BYTES, WHEN_OPTIONS } from "./schema";

const checkRate = createRateLimiter({ limit: 8, windowMs: 60_000 });
// Each analysis calls Rekognition and Nova, so it is capped harder than plain page views.
const checkAnalyseRate = createRateLimiter({ limit: 12, windowMs: 60_000 });

async function readPhoto(form: FormData) {
  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) throw new AppError("invalid_input", "Add a photo of the item.");
  if (!photo.type.startsWith("image/")) throw new AppError("invalid_input", "That file isn’t an image.");
  if (photo.size > MAX_PHOTO_BYTES) throw new AppError("invalid_input", "That photo is too large. Try again: we shrink it for you.");
  return { bytes: new Uint8Array(await photo.arrayBuffer()), type: photo.type };
}

/** Called as soon as a photo is chosen, to pre-fill the form. Never blocks the finder. */
export async function analysePhoto(form: FormData): Promise<ImageAnalysis> {
  try {
    const user = await currentUser();
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    checkAnalyseRate(user?.id ?? ip);
    const { bytes } = await readPhoto(form);
    return await getServices().vision.analyze(bytes);
  } catch (error) {
    logger.warn("found.analyse_failed", { message: String(error) });
    return { labels: [] };
  }
}

export async function logFoundItem(_: FormState, form: FormData): Promise<FormState> {
  const parsed = foundItemSchema.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const services = getServices();
  const user = await currentUser();
  const id = `lst_${crypto.randomUUID().replaceAll("-", "").slice(0, 14)}`;
  let destination = `/items/${id}?posted=1`;

  try {
    checkRate(user?.id ?? "guest");
    const photo = await readPhoto(form);
    if (await services.vision.isUnsafe(photo.bytes)) {
      logger.warn("found.photo_rejected", { guest: !user });
      return { error: "That photo can’t be posted. Take a clear photo of just the item." };
    }
    const imageKey = `up/${id}.jpg`;
    await services.photos.put(imageKey, photo.bytes, photo.type);

    const place =
      input.place === "other"
        ? { name: input.placeOther!, zone: "other" }
        : PLACES[input.place as keyof typeof PLACES];
    const now = Date.now();
    const matric = input.category === "id-card" && input.matric ? normaliseMatric(input.matric) : undefined;

    const listing: Listing = {
      id,
      title: input.title,
      category: input.category,
      colour: input.colour,
      brand: input.brand,
      place,
      foundAt: new Date(now - WHEN_OPTIONS[input.when].hoursAgo * 3_600_000),
      status: "logged",
      imageKey,
      description: input.description ?? "",
      check: { question: input.question, answer: input.answer },
      matric,
      finder: { name: input.contactName, phone: input.contactPhone, email: input.contactEmail, userId: user?.id },
      createdAt: new Date(now),
      manageToken: user ? undefined : crypto.randomUUID().replaceAll("-", ""),
    };
    listing.embedding = await services.embedder?.embed(listingText(listing));
    await services.items.create(listing);

    // ID cards: tell the owner privately if they're on Homeward. The card is never listed.
    if (matric) {
      const owner = await services.users.byMatric(matric);
      if (owner) {
        await services.claims.addNotice({
          id: crypto.randomUUID(),
          userId: owner.id,
          kind: "id-card-match",
          text: `An ID card with your matric number was found near ${place.name}.`,
          itemId: id,
          createdAt: new Date(),
        });
      }
    }
    logger.info("found.logged", { id, category: listing.category, guest: !user, privateMatch: Boolean(matric) });

    if (listing.manageToken) destination += `&key=${listing.manageToken}`;
  } catch (error) {
    if (!(error instanceof AppError)) logger.error("found.log_failed", { message: String(error) });
    return { error: error instanceof AppError ? error.message : "We couldn’t save that. Try again." };
  }
  redirect(destination);
}
