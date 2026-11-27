import { cn } from "@/ui/cn";

/** Nigerian numbers → wa.me format: 0803… becomes 234803… */
const whatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
};

type Contact = { name: string; phone?: string; email?: string };

export function ContactCard({ title, contact, className }: { title: string; contact: Contact; className?: string }) {
  return (
    <div className={cn("rounded-[24px] bg-green p-5 text-paper", className)}>
      <p className="text-[12px] font-bold tracking-[0.12em] text-sun uppercase">{title}</p>
      <p className="mt-2 text-[22px] font-semibold">{contact.name}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {contact.phone && (
          <>
            <a href={whatsapp(contact.phone)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sun px-4 py-2.5 text-[14px] font-semibold text-ink">
              WhatsApp
            </a>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="rounded-full bg-paper/15 px-4 py-2.5 text-[14px] font-semibold">
              Call {contact.phone}
            </a>
          </>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="rounded-full bg-paper/15 px-4 py-2.5 text-[14px] font-semibold">
            {contact.email}
          </a>
        )}
      </div>
      <p className="mt-4 text-[13px] text-paper/75">Meet somewhere public on campus, in daylight if you can. Never pay anyone to get your item back.</p>
    </div>
  );
}
