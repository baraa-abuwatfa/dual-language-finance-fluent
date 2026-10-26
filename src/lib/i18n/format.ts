/**
 * Number formatting for financial figures. Western digits and USD are used in
 * both languages so sample amounts stay consistent and easy to read; the
 * `num` CSS utility keeps them left-to-right inside Arabic text.
 */
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return currency.format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}
