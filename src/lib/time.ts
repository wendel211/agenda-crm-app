import { parseISODate } from './format';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function weekdayName(isoDate: string): string {
  return WEEKDAYS[parseISODate(isoDate).getDay()];
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number): string {
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

interface Range {
  start: string;
  end: string;
}

/** true se [start, start+duração) invade algum intervalo ocupado. */
export function overlapsAny(startTime: string, durationMinutes: number, busy: Range[]): boolean {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return busy.some((range) => start < timeToMinutes(range.end) && timeToMinutes(range.start) < end);
}
