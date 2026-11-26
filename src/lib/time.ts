const timeFormat = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true });

/** "10:14 pm" today, "yesterday", then "3 days ago". */
export function foundAtLabel(date: Date, now = new Date()) {
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return timeFormat.format(date).toLowerCase();
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
