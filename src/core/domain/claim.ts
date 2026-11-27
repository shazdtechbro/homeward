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
