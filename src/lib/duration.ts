export function toTotalMinutes(hours: number, minutes: number) {
  return hours * 60 + minutes;
}

export function formatDuration(totalMinutes: number) {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = Math.round(abs % 60);
  if (hours === 0) return `${sign}${minutes}m`;
  if (minutes === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${minutes}m`;
}

export function splitMinutes(totalMinutes: number) {
  const sign = totalMinutes < 0 ? -1 : 1;
  const abs = Math.abs(totalMinutes);
  return { hours: sign * Math.floor(abs / 60), minutes: Math.round(abs % 60) };
}
