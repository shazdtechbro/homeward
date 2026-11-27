"use client";

import {
  Backpack,
  BatteryCharging,
  Calculator,
  Camera,
  FolderClosed,
  Glasses,
  Headphones,
  IdCard,
  KeyRound,
  Laptop,
  Lock,
  Milk,
  NotebookPen,
  Plug,
  Shirt,
  Smartphone,
  Sparkles,
  Umbrella,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { PLACES } from "@/core/domain/campus-places";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/core/domain/item";
import type { ImageAnalysis } from "@/core/ports";
import type { FormState } from "@/features/auth/schema";
import { Arrow, Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { Field, FormError, inputClass } from "@/ui/field";
import { analysePhoto, logFoundItem } from "../actions";
import { COLOUR_OPTIONS, PLACE_KEYS, SUGGESTED_QUESTIONS, WHEN_OPTIONS } from "../schema";
import { readPhotoOnDevice } from "./on-device-vision";
import { resizePhoto } from "./resize-photo";

function CategoryIcon({ category }: { category: Category }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon aria-hidden className="size-5" strokeWidth={1.75} />;
}

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  laptop: Laptop,
  "laptop-sleeve": FolderClosed,
  phone: Smartphone,
  "id-card": IdCard,
  earbuds: Headphones,
  keys: KeyRound,
  bag: Backpack,
  calculator: Calculator,
  charger: Plug,
  "power-bank": BatteryCharging,
  glasses: Glasses,
  notebook: NotebookPen,
  scarf: Shirt,
  umbrella: Umbrella,
  bottle: Milk,
  watch: Watch,
};

type Draft = {
  title: string;
  category: Category | "";
  colour: string;
  brand: string;
  place: string;
  placeOther: string;
  when: keyof typeof WHEN_OPTIONS;
  description: string;
  question: string;
  answer: string;
  matric: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

type Finder = { name: string; phone?: string; email: string } | null;

const STEPS = ["Photo", "Details", "Proof", "Contact"] as const;

export function FoundWizard({ finder }: { finder: Finder }) {
  const [state, submit, pending] = useActionState<FormState, FormData>(logFoundItem, {});
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [ai, setAi] = useState<ImageAnalysis | null>(null);
  const [aiSource, setAiSource] = useState<"nova" | "device">("device");
  const [localError, setLocalError] = useState<string>();
  const [draft, setDraft] = useState<Draft>({
    title: "",
    category: "",
    colour: "",
    brand: "",
    place: "",
    placeOther: "",
    when: "now",
    description: "",
    question: "",
    answer: "",
    matric: "",
    contactName: finder?.name ?? "",
    contactPhone: finder?.phone ?? "",
    contactEmail: finder?.email ?? "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Server-side validation errors send you back to the step that has them.
  useEffect(() => {
    const keys = Object.keys(state.fieldErrors ?? {});
    if (keys.length === 0) return;
    const stepOf = (k: string) => (["question", "answer"].includes(k) ? 2 : k.startsWith("contact") ? 3 : 1);
    setStep(Math.min(...keys.map(stepOf)));
  }, [state.fieldErrors]);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setLocalError(undefined);
    try {
      const blob = await resizePhoto(file);
      if (photo) URL.revokeObjectURL(photo.url);
      const url = URL.createObjectURL(blob);
      setPhoto({ blob, url });
      setAnalysing(true);
      const fd = new FormData();
      fd.set("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      // Nova in the cloud and MobileNet on the device run side by side; Nova wins where it answers.
      const [cloud, device] = await Promise.all([analysePhoto(fd), readPhotoOnDevice(url)]);
      const fromNova = Boolean(cloud.title);
      const category = cloud.category ?? device.category;
      const colour = cloud.colour ?? device.colour;
      const result: ImageAnalysis = {
        ...cloud,
        category,
        colour,
        labels: cloud.labels.length ? cloud.labels : device.labels,
        title: cloud.title ?? (category ? `${colour ? `${colour[0]!.toUpperCase()}${colour.slice(1)} ` : ""}${CATEGORY_LABELS[category].toLowerCase()}` : undefined),
      };
      setAiSource(fromNova ? "nova" : "device");
      setAi(result);
      setDraft((d) => ({
        ...d,
        title: d.title || result.title || "",
        category: d.category || result.category || "",
        colour: d.colour || result.colour || "",
        brand: d.brand || result.brand || "",
        description: d.description || result.description || "",
        question: d.question || result.question || "",
        matric: d.matric || result.matric || "",
      }));
      if (result.unsafe) setLocalError("That photo can’t be posted. Take a clear photo of just the item.");
    } catch {
      setLocalError("We couldn’t read that photo. Try another one.");
    } finally {
      setAnalysing(false);
    }
  }

  function canContinue() {
    if (step === 0) return Boolean(photo) && !analysing && !ai?.unsafe;
    if (step === 1) return draft.title.trim().length >= 3 && draft.category && draft.colour && draft.place && (draft.place !== "other" || draft.placeOther.trim());
    if (step === 2) return draft.question.trim().length >= 8 && draft.answer.trim().length >= 2;
    return draft.contactName.trim().length >= 2 && (draft.contactPhone.trim() || draft.contactEmail.trim());
  }

  function post() {
    if (!photo) return;
    const fd = new FormData();
    for (const [key, value] of Object.entries(draft)) fd.set(key, String(value));
    fd.set("photo", new File([photo.blob], "photo.jpg", { type: "image/jpeg" }));
    startTransition(() => submit(fd));
  }

  const suggestions = [
    ...(ai?.question ? [ai.question] : []),
    ...(SUGGESTED_QUESTIONS[draft.category || "default"] ?? SUGGESTED_QUESTIONS.default!),
  ].filter((q, i, all) => all.indexOf(q) === i).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
              <motion.div className="h-full bg-coral" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
            </div>
            <span className={cn("mt-2 block text-[12px] font-semibold", i === step ? "text-ink" : "text-ink-2")}>{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          {step === 0 && (
            <>
              <h1 className="font-display-tight text-[40px] sm:text-[52px]">
                Snap what you <em className="font-normal italic">found</em>.
              </h1>
              <p className="mt-3 text-ink-2">One clear photo. Homeward’s AI reads it and drafts the listing for you.</p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => onPhoto(e.target.files?.[0])}
                aria-label="Take or choose a photo"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "group relative mt-7 flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed border-ink/20 bg-white transition hover:border-coral hover:bg-coral/5",
                  photo && "border-solid border-transparent",
                )}
              >
                {photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                    <img src={photo.url} alt="Your photo of the found item" className="absolute inset-0 size-full object-cover" />
                    {analysing && (
                      <span className="absolute inset-0 overflow-hidden bg-ink/30">
                        <span className="animate-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-sky/80 to-transparent" />
                      </span>
                    )}
                    <span className="glass absolute bottom-4 left-4 rounded-full px-4 py-2 text-[13px] font-semibold">
                      {analysing ? "Reading your photo…" : "Tap to retake"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="grid size-20 place-items-center rounded-full bg-coral text-ink shadow-coral transition-transform group-hover:scale-105"><Camera aria-hidden className="size-8" /></span>
                    <span className="mt-5 text-[18px] font-semibold">Take a photo</span>
                    <span className="mt-1 text-[14px] text-ink-2">or choose one from your gallery</span>
                  </>
                )}
              </button>

              {ai && !analysing && (ai.labels.length > 0 || ai.title || ai.colour) && (
                <div className="mt-5 rounded-[20px] bg-sky/35 p-4" aria-live="polite">
                  <p className="text-[13px] font-bold tracking-[0.1em] text-green uppercase"><Sparkles aria-hidden className="mr-1.5 inline size-3.5 align-[-2px]" />{aiSource === "nova" ? "What the AI saw" : "What we read from your photo"}
                    <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] tracking-normal text-ink-2 normal-case">{aiSource === "nova" ? "Amazon Nova on Bedrock" : "Read on your device"}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {ai.title && <span className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper">{ai.title}</span>}
                    {ai.colour && (
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium capitalize">
                        <span aria-hidden className="size-3 rounded-full ring-1 ring-ink/15" style={{ background: COLOUR_OPTIONS.find(([n]) => n === ai.colour)?.[1] }} />
                        {ai.colour}
                      </span>
                    )}
                    {ai.labels.slice(0, 6).map((label) => (
                      <span key={label} className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium">
                        {label}
                      </span>
                    ))}
                  </div>
                  {ai.matric && <p className="mt-3 text-[13px] text-ink-2"><IdCard aria-hidden className="mr-1 inline size-4 align-[-3px]" />Read a matric number off the card. We’ll use it to tell the owner privately.</p>}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h1 className="font-display-tight text-[36px] sm:text-[46px]">What is it, and where was it?</h1>
              {ai?.title && <p className="-mt-3 text-[14px] text-ink-2"><Sparkles aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />We filled in what we could from your photo. Check it.</p>}

              <Field label="Name it" error={errors.title}>
                {(a11y) => <input {...a11y} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Black HP laptop" className={inputClass} maxLength={60} />}
              </Field>

              <fieldset>
                <legend className="text-[14px] font-semibold">Kind of item</legend>
                <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={draft.category === c}
                      onClick={() => set("category", c)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-[14px] border px-1 py-2.5 text-[11px] font-semibold transition",
                        draft.category === c ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white hover:border-ink/30",
                      )}
                    >
                      <CategoryIcon category={c} />
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="mt-2 text-[13px] text-error">{errors.category}</p>}
              </fieldset>

              <fieldset>
                <legend className="text-[14px] font-semibold">Main colour</legend>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {COLOUR_OPTIONS.map(([name, hex]) => (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={draft.colour === name}
                      aria-label={name}
                      title={name}
                      onClick={() => set("colour", name)}
                      className={cn(
                        "size-10 rounded-full ring-1 ring-ink/15 transition",
                        draft.colour === name && "ring-[3px] ring-coral ring-offset-2 ring-offset-paper",
                      )}
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </fieldset>

              <Field label="Brand" optional>
                {(a11y) => <input {...a11y} value={draft.brand} onChange={(e) => set("brand", e.target.value)} placeholder="HP, Tecno, Casio…" className={inputClass} maxLength={30} />}
              </Field>

              {draft.category === "id-card" && (
                <Field label="Matric number on the card" optional error={errors.matric} hint={<><Lock aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />ID cards are never listed publicly. If the owner is on Homeward, only they get told.</>}>
                  {(a11y) => <input {...a11y} value={draft.matric} onChange={(e) => set("matric", e.target.value)} placeholder="19/52HA041" className={cn(inputClass, "font-mono uppercase")} />}
                </Field>
              )}

              <fieldset>
                <legend className="text-[14px] font-semibold">Where did you find it?</legend>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[...PLACE_KEYS, "other" as const].map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={draft.place === key}
                      onClick={() => set("place", key)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                        draft.place === key ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white hover:border-ink/30",
                      )}
                    >
                      {key === "other" ? "Somewhere else" : PLACES[key].name}
                    </button>
                  ))}
                </div>
                {draft.place === "other" && (
                  <input value={draft.placeOther} onChange={(e) => set("placeOther", e.target.value)} placeholder="e.g. Faculty of Agric car park" className={cn(inputClass, "mt-3")} aria-label="Where you found it" maxLength={60} />
                )}
                {(errors.place || errors.placeOther) && <p className="mt-2 text-[13px] text-error">{errors.place ?? errors.placeOther}</p>}
              </fieldset>

              <fieldset>
                <legend className="text-[14px] font-semibold">When?</legend>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(WHEN_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={draft.when === key}
                      onClick={() => set("when", key as Draft["when"])}
                      className={cn(
                        "rounded-[14px] border px-3 py-2.5 text-[13px] font-semibold transition",
                        draft.when === key ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white hover:border-ink/30",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Field label="Anything else?" optional hint="Don’t include names or numbers you can read on the item.">
                {(a11y) => <textarea {...a11y} value={draft.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={280} className={inputClass} placeholder="Left on a reading desk upstairs, charger was with it." />}
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h1 className="font-display-tight text-[36px] sm:text-[46px]">
                Ask something only the <em className="font-normal italic">owner</em> knows.
              </h1>
              <p className="-mt-2 text-ink-2">Anyone claiming it must answer before they see how to reach you. Pick a detail that isn’t in your photo.</p>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((q, i) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => set("question", q)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition",
                      draft.question === q ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white hover:border-ink/30",
                    )}
                  >
                    {i === 0 && ai?.question === q && <Sparkles aria-hidden className="mr-1 inline size-3.5 align-[-2px] text-coral" />}
                    {q}
                  </button>
                ))}
              </div>

              <Field label="Your question" error={errors.question}>
                {(a11y) => <input {...a11y} value={draft.question} onChange={(e) => set("question", e.target.value)} placeholder="What sticker is on the lid?" className={inputClass} maxLength={120} />}
              </Field>
              <Field label="The answer" error={errors.answer} hint={<><Lock aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />Never shown to anyone. Our AI checks claims against it, allowing for different wording.</>}>
                {(a11y) => <input {...a11y} value={draft.answer} onChange={(e) => set("answer", e.target.value)} placeholder="Green Super Eagles sticker" className={inputClass} maxLength={80} />}
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-display-tight text-[36px] sm:text-[46px]">How should the owner reach you?</h1>
              <div className="rounded-[20px] bg-green p-5 text-paper">
                <p className="flex items-center gap-2 font-semibold"><Lock aria-hidden className="size-4" /> Shown only after someone proves it’s theirs.</p>
                <p className="mt-1 text-[14px] text-paper/80">Meet somewhere public on campus to hand it over: a faculty entrance, the library foyer, the SUB.</p>
              </div>

              {finder ? (
                <p className="text-[15px] text-ink-2">
                  Posting as <b className="text-ink">{finder.name}</b>. You’ll earn <b className="text-ink">+50 karma</b> when it gets home.
                </p>
              ) : (
                <p className="text-[15px] text-ink-2">
                  Posting as a guest.{" "}
                  <Link href="/sign-in?next=/found/new" className="font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4">
                    Sign in
                  </Link>{" "}
                  to track it and earn karma.
                </p>
              )}

              <Field label="Your name" error={errors.contactName}>
                {(a11y) => <input {...a11y} value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} autoComplete="name" placeholder="Emeka" className={inputClass} />}
              </Field>
              <Field label="Phone or WhatsApp" error={errors.contactPhone}>
                {(a11y) => <input {...a11y} value={draft.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" className={inputClass} />}
              </Field>
              <Field label="Email" optional error={errors.contactEmail}>
                {(a11y) => <input {...a11y} value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} type="email" autoComplete="email" placeholder="you@students.unilorin.edu.ng" className={inputClass} />}
              </Field>
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="mt-6 space-y-3">
        <FormError message={localError ?? state.error} />
      </div>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 -mx-5 mt-8 flex gap-3 bg-gradient-to-t from-paper via-paper to-transparent px-5 pt-6 pb-4 sm:static sm:mx-0 sm:bg-none sm:p-0">
        {step > 0 && (
          <Button type="button" variant="ghost" size="lg" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" size="lg" className="flex-1" disabled={!canContinue()} onClick={() => setStep((s) => s + 1)}>
            {analysing ? "Reading photo…" : "Continue"} <Arrow />
          </Button>
        ) : (
          <Button type="button" size="lg" variant="coral" className="flex-1" disabled={!canContinue() || pending} onClick={post}>
            {pending ? "Posting…" : "Post found item"} {!pending && <Arrow />}
          </Button>
        )}
      </div>
    </div>
  );
}
