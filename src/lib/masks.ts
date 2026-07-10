/** Máscaras de entrada pt-BR. */

/** (11) 98877-1234 conforme o usuário digita. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Dígitos viram centavos: "1234" → "R$ 12,34". */
export function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  const cents = Number(digits);
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** "R$ 12,34" → 12.34 */
export function parseCurrency(masked: string): number {
  const digits = masked.replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}

/** DD/MM/AAAA conforme o usuário digita. */
export function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "14/03/1992" → "1992-03-14" (ou undefined se incompleta). */
export function dateMaskToISO(masked: string): string | undefined {
  const digits = masked.replace(/\D/g, '');
  if (digits.length !== 8) {
    return undefined;
  }
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4);
  return `${year}-${month}-${day}`;
}
