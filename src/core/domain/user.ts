export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** Lets the network tell a student privately when their ID card is found. */
  matric?: string;
  faculty?: string;
  passwordHash: string;
  karma: number;
  createdAt: Date;
};

/** What the rest of the app may see about a user. Never the password hash. */
export type PublicUser = Omit<User, "passwordHash">;

export const toPublicUser = ({ passwordHash: _, ...user }: User): PublicUser => user;

/** UNILORIN matric numbers look like 19/52HA041; compare them without slashes or case. */
export const normaliseMatric = (matric: string) => matric.replace(/[^a-z0-9]/gi, "").toUpperCase();

export const KARMA_PER_RETURN = 50;
