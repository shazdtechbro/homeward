import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { toPublicUser, type PublicUser } from "@/core/domain/user";
import { getServices } from "@/infra/container";
import { env } from "./env";

const COOKIE = "hw_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const key = new TextEncoder().encode(env.HOMEWARD_SESSION_SECRET);

/** Signed, httpOnly, SameSite=Lax. Holds only the user id. */
export async function startSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in user, or null. Cached per request. */
export const currentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const user = payload.sub ? await getServices().users.get(payload.sub) : undefined;
    return user ? toPublicUser(user) : null;
  } catch {
    return null;
  }
});

export async function requireUser(next: string): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}
