import type { OpeningPeriod } from "../types/config";

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;
export function hasScheduleOverlap(periods: OpeningPeriod[]) {
  const intervals = periods.map((period) => {
    const start = (period.day - 1) * MINUTES_PER_DAY + clockMinutes(period.opensAt);
    const end = (period.day - 1 + Number(period.closesNextDay)) * MINUTES_PER_DAY + clockMinutes(period.closesAt);
    return { start, end };
  });
  return intervals.some((interval, index) => intervals.some((other, otherIndex) => {
    if (otherIndex === index) return false;
    return overlapAcrossWeek(interval.start, interval.end, other.start, other.end);
  }));
}
function overlapAcrossWeek(start: number, end: number, otherStart: number, otherEnd: number) {
  return [0, MINUTES_PER_WEEK, -MINUTES_PER_WEEK].some((shift) => start < otherEnd + shift && end > otherStart + shift);
}
export function clockMinutes(clock: string) {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}
