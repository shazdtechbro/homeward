import { Logo } from "@/ui/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#demo", label: "Try the AI" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#for-campus", label: "For campus" },
      { href: "#safety", label: "Safety" },
    ],
  },
  {
    title: "Homeward",
    links: [
      { href: "#about", label: "About" },
      { href: "#get-the-app", label: "Join the beta" },
      { href: "mailto:hello@homeward.ng", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-6 bg-green px-5 pt-20 pb-10 text-paper">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="max-w-sm">
            <Logo tone="paper" />
            <p className="mt-4 text-[16px] font-medium text-paper/70">
              The lost-and-found network for the University of Ilorin. Snap it, match it, prove it, collect it.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-12">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[13px] font-bold tracking-[0.12em] text-sun uppercase">{column.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-[16px] font-medium text-paper/85 hover:text-paper">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p aria-hidden className="mt-20 text-[22vw] leading-[0.8] font-extrabold tracking-[-0.06em] text-paper/[0.07] select-none md:text-[18vw]">
          Homeward
        </p>
        <div className="mt-6 flex flex-col justify-between gap-2 border-t border-paper/15 pt-6 text-[14px] text-paper/60 sm:flex-row">
          <span>© 2026 Homeward. Made in Ilorin.</span>
          <span>Built for the AWS Builders pitchathon</span>
        </div>
      </div>
    </footer>
  );
}
