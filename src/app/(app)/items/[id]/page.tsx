import { Check, Lock, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS } from "@/core/domain/item";
import { MAX_CLAIM_ATTEMPTS } from "@/core/domain/listing";
import { ClaimPanel } from "@/features/claims/components/claim-panel";
import { ContactCard } from "@/features/claims/components/contact-card";
import { HandoverForm } from "@/features/claims/components/handover-form";
import { PickupCodeCard } from "@/features/claims/components/pickup-code-card";
import { isDemoListing } from "@/infra/demo-seeds";
import { getServices } from "@/infra/container";
import { currentUser } from "@/lib/session";
import { foundAtLabel } from "@/lib/time";
import { ItemPhoto } from "@/ui/item-photo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string; key?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getServices().items.get((await params).id);
  if (!listing || listing.category === "id-card") return { title: "Found item · Homeward" };
  return { title: `${listing.title} · Found near ${listing.place.name} · Homeward` };
}

export default async function ItemPage({ params, searchParams }: Props) {
  const [{ id }, { posted, key }] = await Promise.all([params, searchParams]);
  const { items, claims } = getServices();
  const [first, user] = await Promise.all([items.get(id), currentUser()]);
  // Belt and braces for a page opened the instant after posting.
  const listing = first ?? (await new Promise((r) => setTimeout(r, 400)).then(() => items.get(id)));
  if (!listing) notFound();

  const isFinder = Boolean(
    (user && listing.finder.userId === user.id) || (key && listing.manageToken === key),
  );
  const ownsCard = Boolean(listing.matric && user?.matric === listing.matric);

  if (listing.category === "id-card" && !isFinder && !ownsCard) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[28px] bg-green p-8 text-paper">
        <Lock aria-hidden className="size-10 text-sun" />
        <h1 className="mt-3 font-display-tight text-[38px]">This ID card is private.</h1>
        <p className="mt-3 text-paper/85">
          ID cards are only shown to the student whose matric number is on them. If it’s yours, sign
          in with an account that has your matric number.
        </p>
        {!user && (
          <Link
            href={`/sign-in?next=/items/${id}`}
            className="mt-6 inline-flex rounded-full bg-sun px-5 py-3 font-semibold text-ink"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  const itemClaims = await claims.forItem(id);
  const verifiedClaims = itemClaims.filter((c) => c.status === "verified");
  const mine = user ? itemClaims.filter((c) => c.claimantId === user.id) : [];
  const myClaim = mine.find((c) => c.status === "verified");
  const attemptsLeft = Math.max(
    0,
    MAX_CLAIM_ATTEMPTS - mine.filter((c) => c.status === "rejected").length,
  );
  const returned = listing.status === "claimed";
  const demo = isDemoListing(id);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      {posted && (
        <div className="rounded-[24px] bg-sun p-5 lg:col-span-2">
          <p className="flex items-center gap-2 text-[20px] font-semibold">
            <PartyPopper aria-hidden className="size-5" /> It’s live. Thank you for doing the right
            thing.
          </p>
          <p className="mt-1 text-ink/80">
            The owner will see it when they search. They must answer your question before they can
            reach you.
          </p>
          {listing.manageToken && (
            <p className="mt-3 rounded-[14px] bg-paper/70 p-3 text-[14px]">
              <b>Bookmark this page.</b> You posted as a guest, so this private link is how you mark
              it returned later.
            </p>
          )}
        </div>
      )}

      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-paper-2 shadow-soft">
          <ItemPhoto
            imageKey={listing.imageKey}
            alt={listing.title}
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
            className="size-full"
          />
          {returned && (
            <span className="absolute top-4 left-4 rounded-full bg-green px-4 py-2 text-[14px] font-bold text-paper">
              <Check aria-hidden className="mr-1 inline size-4 align-[-3px]" />
              Returned home
            </span>
          )}
          {demo && (
            <span className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-ink-2">
              Demo listing
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-bold tracking-[0.14em] text-coral uppercase">
          Found · {CATEGORY_LABELS[listing.category]}
        </p>
        <h1 className="mt-3 font-display-tight text-[42px] sm:text-[56px]">{listing.title}</h1>
        <dl className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["Where", listing.place.name],
            ["When", foundAtLabel(listing.foundAt)],
            ["Colour", listing.colour],
            ["Brand", listing.brand ?? "Not noted"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[16px] bg-white p-3.5 ring-1 ring-ink/5">
              <dt className="text-[12px] font-semibold text-ink-2">{label}</dt>
              <dd className="mt-0.5 font-semibold first-letter:uppercase">{value}</dd>
            </div>
          ))}
        </dl>
        {listing.description && (
          <p className="mt-5 text-[16px] text-ink-2">{listing.description}</p>
        )}

        <div className="mt-8">
          {isFinder ? (
            <FinderPanel
              itemId={id}
              manageKey={key}
              returned={returned}
              verifiedClaims={verifiedClaims}
            />
          ) : returned ? (
            <p className="rounded-[24px] bg-white p-6 text-ink-2 shadow-soft">
              This item has already gone home.
            </p>
          ) : myClaim ? (
            <div className="space-y-4">
              <ContactCard title="Proved. Here’s the finder" contact={listing.finder} />
              {myClaim.pickupCode && <PickupCodeCard code={myClaim.pickupCode} />}
            </div>
          ) : (
            <ClaimPanel
              itemId={id}
              question={listing.check.question}
              signedIn={Boolean(user)}
              attemptsLeft={attemptsLeft}
              matricProof={ownsCard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type FinderPanelProps = {
  itemId: string;
  manageKey?: string;
  returned: boolean;
  verifiedClaims: Array<{
    claimantId: string;
    claimantName: string;
    claimantPhone?: string;
    claimantEmail?: string;
  }>;
};

function FinderPanel({ itemId, manageKey, returned, verifiedClaims }: FinderPanelProps) {
  if (returned) {
    return (
      <p className="rounded-[24px] bg-green p-6 text-paper">
        You got this one home. Karma added. Thank you!
      </p>
    );
  }
  const latest = verifiedClaims[0];
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-bold tracking-[0.12em] text-ink-2 uppercase">You found this</p>
      {!latest ? (
        <p className="rounded-[24px] bg-white p-6 text-ink-2 shadow-soft">
          No one has proved it’s theirs yet. The moment they do, you’ll see how to reach them here
          and in your inbox.
        </p>
      ) : (
        <>
          <ContactCard
            title="Proved ownership"
            contact={{
              name: latest.claimantName,
              phone: latest.claimantPhone,
              email: latest.claimantEmail,
            }}
          />
          <HandoverForm
            itemId={itemId}
            manageKey={manageKey}
            ownerFirstName={latest.claimantName.split(" ")[0] ?? "the owner"}
          />
        </>
      )}
    </div>
  );
}
