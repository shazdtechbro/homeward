export type ClaimStatus = "verified" | "rejected";

export type Claim = {
  id: string;
  itemId: string;
  itemTitle: string;
  claimantId: string;
  claimantName: string;
  /** Shared with the finder only once the claim is verified, so they can arrange the handover. */
  claimantPhone?: string;
  claimantEmail?: string;
  status: ClaimStatus;
  /**
   * Issued when ownership is proved. The owner shows it at the meet-up and the
   * finder types it in before handing over, so the item goes to the right person.
   */
  pickupCode?: string;
  createdAt: Date;
};

/** In-app inbox entry: private ID-card matches, claims on your finds, returns. */
export type Notice = {
  id: string;
  userId: string;
  kind: "id-card-match" | "claim-verified" | "returned";
  text: string;
  itemId: string;
  createdAt: Date;
};

/** Four digits, from a CSPRNG. */
export function newPickupCode(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return String(n! % 10_000).padStart(4, "0");
}
