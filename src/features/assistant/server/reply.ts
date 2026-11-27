import "server-only";
import type { SearchResponse } from "@/features/ai-demo/schema";
import type { Turn } from "@/infra/ai/model";

const PERSONA = `You are Homeward AI, the lost-and-found assistant for students at the University of Ilorin, Nigeria.
Someone has just lost something and may be stressed. Be warm, calm and reassuring, like a kind senior student.
Write 2 to 3 short sentences, plain friendly English (a light Nigerian touch is welcome). Use one or two emojis at most.
Only talk about the search results given to you below. Never invent items, places or people, and never promise an item is theirs.
Write plain conversational text: no markdown, no asterisks, no bullet points or lists. The matches already appear as cards under your message, so don't list them.`;

/** Turns the search outcome into instructions the model can't drift away from. */
export function systemPrompt(result: SearchResponse, privateMatch: boolean, hasMatric: boolean) {
  const understood =
    result.fields.map((f) => `${f.label}: ${f.value}`).join(", ") || "nothing specific yet";
  const missing = ["Category", "Place", "When"].filter(
    (l) => !result.fields.some((f) => f.label === l),
  );
  const QUESTIONS: Record<string, string> = {
    Category: "what the item is",
    Place: "where on campus they last had it",
    When: "roughly when they last had it",
  };
  const ask = missing[0]
    ? `End with ONE short, gentle question asking ${QUESTIONS[missing[0]]}. Ask nothing else.`
    : "You already know what, where and when. Don't ask any more questions.";

  let outcome: string;
  if (result.fields.length === 0) {
    return `${PERSONA}

They haven't described an item yet. Greet them kindly and ask what they lost. Don't mention any search.`;
  }
  if (result.outcome.kind === "matches") {
    const list = result.outcome.matches
      .map((m) => `${m.title} (${m.score}% match, found at ${m.place}, ${m.when})`)
      .join("; ");
    outcome = `Found ${result.outcome.matches.length} possible matches, shown as cards under your message: ${list}.
Reassure them, mention the best match by name, and tell them to tap "Is this yours?" and answer the finder's question to unlock the finder's contact and a pickup code.`;
  } else if (result.outcome.kind === "private") {
    outcome = privateMatch
      ? "It's an ID card, and a card with their matric number HAS been handed in. Tell them the good news and to tap the button below to see it."
      : hasMatric
        ? "It's an ID card. None with their matric number has been handed in yet. Reassure them they'll be told privately in their inbox the moment one is."
        : "It's an ID card. ID cards are never listed publicly; they're matched privately by matric number. Suggest creating an account with their matric number so they're told privately when it turns up.";
  } else {
    outcome = `Nothing matching has been handed in yet out of ${result.scanned} finds. Comfort them: items often turn up over the next few days, so check back.`;
  }

  return `${PERSONA}\n\nWhat you understood from them: ${understood}.\n${outcome}\n${ask}`;
}

/** Used when no model is reachable, so the conversation never goes silent. */
export function fallbackReply(result: SearchResponse, privateMatch: boolean): string {
  if (result.fields.length === 0) return "Hey 👋 I'm here to help. What did you lose?";
  if (result.outcome.kind === "matches") {
    const best = result.outcome.matches[0]!;
    return `Don't worry, we'll sort this out 🙏 The closest match is the ${best.title} found at ${best.place} (${best.score}% match). Tap "Is this yours?" and answer the finder's question to get their contact and a pickup code.`;
  }
  if (result.outcome.kind === "private") {
    return privateMatch
      ? "Good news 🎉 A card with your matric number has been handed in. Tap below to see it."
      : "ID cards are matched privately by matric number, so they never show up in public. Add your matric number to your account and you'll be told the moment it turns up 🔒";
  }
  const where = result.fields.some((f) => f.label === "Place");
  return where
    ? "Nothing like it has been handed in yet, but things often turn up over the next few days 🤞 Check back soon."
    : "I'm on it 👀 Where did you last have it? That helps me narrow things down.";
}

/** Tap-to-send replies that fill in whatever is still missing. */
export function suggestions(result: SearchResponse): string[] {
  const has = (label: string) => result.fields.some((f) => f.label === label);
  if (!has("Category")) return ["My phone", "My laptop", "My ID card", "My bag"];
  if (!has("Place"))
    return ["At the Main Library", "At the CBT Centre", "On the shuttle", "At my faculty"];
  if (!has("When")) return ["Today", "Last night", "Yesterday", "A few days ago"];
  return [];
}

export const toTurns = (messages: Turn[]) => messages.slice(-8);
