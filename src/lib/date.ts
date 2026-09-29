// All technicians and admins operate in Romania, but the server that
// renders these pages runs in UTC — computing "today" from the server's
// wall clock can land on the wrong calendar day for a few hours around
// midnight (e.g. 00:30 in Bucharest is still 21:30/22:30 UTC the day
// before). Every "what day is it right now" computation must go through
// this timezone instead of Date.prototype.toISOString().
export const ORG_TIME_ZONE = "Europe/Bucharest";

export function todayInOrgTimeZone(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ORG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function nowTimeInOrgTimeZone(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ORG_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
