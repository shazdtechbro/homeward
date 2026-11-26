import { cn } from "./cn";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-lg shadow-soft", className)} {...props}>
      {children}
    </div>
  );
}
