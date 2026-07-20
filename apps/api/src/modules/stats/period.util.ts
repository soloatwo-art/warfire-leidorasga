export type StatsPeriod = "day" | "week" | "month" | "all";

export function getPeriodStart(period: StatsPeriod, now: Date = new Date()): Date {
  switch (period) {
    case "day": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    case "month": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }
    case "all":
    default:
      return new Date(0);
  }
}
