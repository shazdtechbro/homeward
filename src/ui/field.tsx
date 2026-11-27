import { useId } from "react";
import { cn } from "./cn";

export const inputClass =
  "block w-full rounded-[14px] border border-ink/12 bg-white px-4 py-3.5 text-[16px] text-ink shadow-[0_1px_0_rgba(20,20,18,0.04)] transition-[border-color,box-shadow] outline-none placeholder:text-ink-2/60 focus:border-ink/40 focus:ring-4 focus:ring-sun/40 aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/15";

type FieldProps = {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label, control, hint and error wired together for screen readers. */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[14px] font-semibold text-ink">
        {label}
        {optional && <span className="text-[12px] font-medium text-ink-2">Optional</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] font-medium text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-ink-2">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[14px] bg-error/10 px-4 py-3 text-[14px] font-medium text-error">
      {message}
    </p>
  );
}
