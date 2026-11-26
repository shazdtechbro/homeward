import { InViewPlay } from "@/ui/in-view-play";

const SERVICES = [
  ["Cognito", "university sign-in"],
  ["Bedrock", "understands every report"],
  ["Rekognition", "blurs faces and IDs"],
  ["Textract", "reads matric numbers"],
  ["S3 Vectors", "finds lookalike items"],
  ["Step Functions", "runs each claim"],
  ["Location Service", "maps the Spots"],
  ["DynamoDB", "stores every item"],
] as const;

export function AwsStrip() {
  return (
    <section aria-labelledby="aws-title" className="overflow-hidden py-20 sm:py-28">
      <p id="aws-title" className="text-center text-[13px] font-bold tracking-[0.12em] text-ink-2 uppercase">
        Built on AWS · serverless, scales with every semester
      </p>
      <InViewPlay className="relative mt-8 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="animate-marquee flex w-max gap-3">
          {[...SERVICES, ...SERVICES].map(([name, role], i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= SERVICES.length}
              className="flex items-baseline gap-2.5 rounded-full bg-paper-2 px-5 py-3 whitespace-nowrap"
            >
              <span className="text-[16px] font-bold">{name}</span>
              <span className="font-mono text-[13px] text-ink-2">{role}</span>
            </li>
          ))}
        </ul>
      </InViewPlay>
    </section>
  );
}
