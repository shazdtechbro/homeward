import { getServices } from "@/infra/container";
import { currentUser } from "@/lib/session";

/**
 * Photos live in a private bucket and are streamed through here, so we decide
 * who sees what. ID-card photos are only shown to the finder and the card's owner.
 */
export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const match = /^up\/(lst_[a-z0-9]+)\.jpg$/.exec(key);
  if (!match) return new Response("Not found", { status: 404 });

  const { items, photos } = getServices();
  const listing = await items.get(match[1]!);
  if (!listing) return new Response("Not found", { status: 404 });

  if (listing.category === "id-card") {
    const user = await currentUser();
    const allowed = user && (user.id === listing.finder.userId || (user.matric && user.matric === listing.matric));
    if (!allowed) return new Response("Private", { status: 403 });
  }

  const photo = await photos.get(key);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": listing.category === "id-card" ? "private, no-store" : "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
