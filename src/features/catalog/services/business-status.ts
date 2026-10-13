import type { BusinessStatus, CatalogConfiguration } from "../types/catalog";
import { clockMinutes } from "@/features/business-config/services/schedule";

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;
const ISO_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function businessStatus(config: CatalogConfiguration, serverNow: string): BusinessStatus {
  if (!config.scheduleConfirmed) return "unknown";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(serverNow));
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === name)?.value ?? "";
  const now = ISO_DAYS.indexOf(part("weekday")) * MINUTES_PER_DAY + Number(part("hour")) * 60 + Number(part("minute"));
  const isOpen = config.openingPeriods.some((period) => {
    const start = (period.day - 1) * MINUTES_PER_DAY + clockMinutes(period.opensAt);
    const end = (period.day - 1 + Number(period.closesNextDay)) * MINUTES_PER_DAY + clockMinutes(period.closesAt);
    return [now, now + MINUTES_PER_WEEK].some((time) => time >= start && time < end);
  });
  return isOpen ? "open" : "closed";
}
