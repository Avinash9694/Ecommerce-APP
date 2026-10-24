const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/** Formats an integer amount in minor units (paise/cents) as a currency string. */
export function formatMoney(minor: number, currency = 'INR'): string {
  const major = minor / 100;
  const formatter = formatterFor(currency);
  if (Number.isInteger(major)) return formatter.format(major);
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(major);
}

/** Parses a user-typed major-unit amount ("1,299.50") into minor units, or null if invalid. */
export function parseMoneyInput(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, '');
  if (!cleaned || cleaned.split('.').length > 2) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export const majorUnits = (minor: number): string => (minor / 100).toString();
