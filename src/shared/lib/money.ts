const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** `৳ 1,250` — rounded, used for totals and cards. */
export function formatTaka(amount: number): string {
  return `৳ ${whole.format(amount)}`;
}

/** `৳ 12.50` — keeps decimals when the amount has them. */
export function formatTakaExact(amount: number): string {
  return `৳ ${exact.format(amount)}`;
}

/** Compact axis label: 1500 → `1.5k`. */
export function formatCompact(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(Math.round(amount));
}
