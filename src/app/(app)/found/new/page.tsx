import type { Metadata } from "next";
import { FoundWizard } from "@/features/found/components/found-wizard";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Log a found item · Homeward" };

export default async function FoundPage() {
  const user = await currentUser();
  return <FoundWizard finder={user && { name: user.name, phone: user.phone, email: user.email }} />;
}
