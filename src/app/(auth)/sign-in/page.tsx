import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { safeNext } from "@/features/auth/schema";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in · Homeward" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await currentUser()) redirect(safeNext(next));

  return (
    <AuthShell
      art="03-handoff"
      quote="I got my laptop back the morning of my exam. Someone just… returned it."
      quoteBy="Femi, 400L Mechanical Engineering"
      chips={[
        { icon: "✦", text: "92% match · Black HP laptop", className: "top-[14%] left-[10%]" },
        { icon: "✓", text: "Ownership proved", className: "top-[30%] right-[8%]" },
      ]}
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
