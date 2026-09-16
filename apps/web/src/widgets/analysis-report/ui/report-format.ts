export function formatScore(value: number): string {
  return value.toFixed(3);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}
