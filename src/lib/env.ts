import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOMEWARD_ADAPTERS: z.enum(["mock"]).default("mock"),
  AWS_REGION: z.string().default("eu-west-1"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
}

export const env = parsed.data;
