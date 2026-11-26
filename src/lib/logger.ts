type Level = "info" | "warn" | "error";

/** One JSON line per event, which is what CloudWatch Logs Insights wants. */
function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, fields?: Record<string, unknown>) => log("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => log("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => log("error", event, fields),
};
