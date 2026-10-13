const DAY_MILLISECONDS = 86_400_000;
const DEFAULT_PERIOD_DAYS = 30;

export function defaultPeriod(now = new Date()) {
  const until = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const from = new Date(Date.parse(until + "T12:00:00Z") - (DEFAULT_PERIOD_DAYS - 1) * DAY_MILLISECONDS).toISOString().slice(0, 10);
  return { from, until };
}
export function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(value)) : "Sin visitas acreditadas";
}
