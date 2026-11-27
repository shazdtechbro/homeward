import { cn } from "./cn";

export function GlassCard({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg shadow-soft glass", className)} {...props}>
      {children}
    </div>
  );
}
