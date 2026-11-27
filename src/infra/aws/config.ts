import "server-only";
import { env } from "@/lib/env";

/**
 * On Amplify the SSR compute role supplies credentials automatically. Amplify
 * reserves the AWS_ prefix, so explicit keys (local dev, or hosting outside
 * AWS) use HOMEWARD_ names instead.
 */
export function awsClientConfig() {
  const region = env.HOMEWARD_REGION;
  const accessKeyId = env.HOMEWARD_ACCESS_KEY_ID;
  const secretAccessKey = env.HOMEWARD_SECRET_ACCESS_KEY;
  return accessKeyId && secretAccessKey ? { region, credentials: { accessKeyId, secretAccessKey } } : { region };
}
