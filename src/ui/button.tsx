import Link from "next/link";
import { cn } from "./cn";

type Variant = "ink" | "coral" | "ghost" | "light";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] tracking-[-0.01em] transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  ink: "bg-ink text-paper hover:shadow-soft",
  coral: "bg-coral text-ink hover:shadow-coral",
  ghost: "bg-transparent text-ink ring-1 ring-ink/15 hover:bg-ink/5",
  light: "bg-paper text-ink hover:shadow-soft",
};

const sizes = { md: "h-11 px-5", lg: "h-14 px-7 text-base" } as const;

type CommonProps = {
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
};

export function buttonClass({
  variant = "ink",
  size = "md",
  className,
}: Omit<CommonProps, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  href,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={buttonClass({ variant, size, className })}>
      {children}
    </Link>
  );
}

export function Arrow() {
  return (
    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
      →
    </span>
  );
}
