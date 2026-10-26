/**
 * Fictional sample figures for the Phase 1 dashboard mockup.
 * These are NOT real business data and are always shown with an
 * "illustrative" label in the UI.
 */
export const SAMPLE_SERIES = {
  revenue: [32400, 35800, 34100, 40600, 44900, 48250],
  expenses: [24100, 26900, 25700, 29400, 31000, 31780],
};

export const SAMPLE_KPIS = [
  { key: "revenue", value: 48250, delta: 7.5, goodWhenUp: true, spark: [32, 36, 34, 41, 45, 48] },
  { key: "expenses", value: 31780, delta: 2.5, goodWhenUp: false, spark: [24, 27, 26, 29, 31, 32] },
  { key: "netProfit", value: 16470, delta: 18.5, goodWhenUp: true, spark: [8, 9, 8.4, 11, 13.9, 16.5] },
  { key: "cashFlow", value: 9840, delta: 6.3, goodWhenUp: true, spark: [6, 7.1, 6.6, 8.2, 9.2, 9.8] },
] as const;

export type KpiKey = (typeof SAMPLE_KPIS)[number]["key"];
