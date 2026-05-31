// dateHelper.ts

export function formatRelativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  
  // Format typically: "2026-05-31 13:06:26"
  // Try to parse the string safely across environments
  const standardizedStr = dateStr.includes(' ') && !dateStr.includes('T') 
    ? dateStr.replace(' ', 'T') 
    : dateStr;

  const date = new Date(standardizedStr);
  if (isNaN(date.getTime())) {
    // If it fails to parse, try standard fallback
    const fallbackDate = new Date(dateStr);
    if (isNaN(fallbackDate.getTime())) {
      return dateStr; // fallback to original string
    }
    return getRelativeString(fallbackDate);
  }

  return getRelativeString(date);
}

function getRelativeString(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const isFuture = diffMs > 0;
  const absDays = Math.abs(diffDays);
  const absHours = Math.abs(diffHours);
  const absMins = Math.abs(diffMins);

  if (absMins < 1) {
    return isFuture ? 'in a few seconds' : 'just now';
  }
  if (absMins < 60) {
    return isFuture ? `in ${absMins} ${absMins === 1 ? 'min' : 'mins'}` : `${absMins} ${absMins === 1 ? 'min' : 'mins'} ago`;
  }
  if (absHours < 24) {
    return isFuture ? `in ${absHours} ${absHours === 1 ? 'hour' : 'hours'}` : `${absHours} ${absHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (absDays < 30) {
    return isFuture ? `in ${absDays} ${absDays === 1 ? 'day' : 'days'}` : `${absDays} ${absDays === 1 ? 'day' : 'days'} ago`;
  }
  if (absDays < 365) {
    const months = Math.abs(diffMonths);
    return isFuture ? `in ${months} ${months === 1 ? 'month' : 'months'}` : `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.abs(diffYears);
  return isFuture ? `in ${years} ${years === 1 ? 'year' : 'years'}` : `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export function isFutureDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const standardizedStr = dateStr.includes(' ') && !dateStr.includes('T') 
    ? dateStr.replace(' ', 'T') 
    : dateStr;
  const date = new Date(standardizedStr);
  if (isNaN(date.getTime())) {
    const fallbackDate = new Date(dateStr);
    if (isNaN(fallbackDate.getTime())) {
      return false;
    }
    return fallbackDate.getTime() > Date.now();
  }
  return date.getTime() > Date.now();
}

export function formatPrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null) return 'Free';
  const priceStr = String(price).trim();
  if (priceStr.toLowerCase() === 'free' || priceStr === '0' || priceStr === '') {
    return 'Free';
  }
  // Try parsing as number
  const parsed = parseFloat(priceStr);
  if (isNaN(parsed)) {
    // If it's a code/string that is not a numeric price, return as is
    return priceStr;
  }
  if (parsed === 0) return 'Free';
  // Format beautifully with dollar sign! E.g., $49.90
  return `$${parsed.toFixed(2)}`;
}
