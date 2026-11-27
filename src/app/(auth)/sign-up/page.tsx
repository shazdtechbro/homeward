import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { safeNext } from "@/features/auth/schema";
import { currentUser } from "@/lib/session";
import { AppProviders } from "@/ui/app-providers";

export const metadata: Metadata = { title: "Join Homeward" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await currentUser()) redirect(safeNext(next));

  return (
    <AppProviders>
      <AuthShell
        art="02-finder"
        quote="Somebody on this campus has your thing. Let’s make it easy for them to give it back."
        quoteBy="The Homeward promise"
        chips={[
          { icon: "📷", text: "Snap it in 10 seconds", className: "top-[12%] left-[9%]" },
          { icon: "🔒", text: "Your number stays private", className: "top-[26%] right-[7%]" },
          { icon: "✦", text: "+50 karma per return", className: "top-[42%] left-[14%]" },
        ]}
      >
        <SignUpForm next={next} />
      </AuthShell>
    </AppProviders>
  );
}
