import { z } from "zod";

const email = z.string().trim().toLowerCase().email("That email doesn’t look right.");
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{10,15}$/, "Use a Nigerian number like 0803 123 4567.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(60),
  email,
  password: z.string().min(8, "Use at least 8 characters."),
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
  matric: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || undefined),
  faculty: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || undefined),
});

/** Where to send someone after sign-in. Only same-site paths, never an open redirect. */
export const safeNext = (value: FormDataEntryValue | string | null | undefined) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/home";
};

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** What the person typed, so a failed submit doesn't wipe the form. Never passwords. */
  values?: Record<string, string>;
};

export function echo(form: FormData, ...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, String(form.get(n) ?? "")]));
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
