/** Formatadores pt-BR. Instâncias de Intl são criadas uma única vez (custo alto). */

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });
const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatLongDate(date: Date): string {
  return longDate.format(date);
}

export function formatWeekday(date: Date): string {
  return weekday.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

/** Converte 'YYYY-MM-DD' em Date local (sem deslocamento de fuso). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}`;
}
