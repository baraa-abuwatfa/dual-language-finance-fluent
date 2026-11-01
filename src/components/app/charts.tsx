import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAmount, monthLabel } from "@/lib/finance/queries";
import { useAppCopy } from "@/lib/company/use-company";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { categoryLabel } from "@/lib/finance/categories";

type Monthly = { month: string; revenue: number; expenses: number };
const PIE = ["var(--navy)", "var(--steel)", "var(--taupe)", "var(--mist)", "var(--champagne)", "var(--cloud)"];

/** Bars with a lit gradient face and soft drop shadow for a subtle 3D depth. */
export function MonthlyChart({ data, currency }: { data: Monthly[]; currency: string }) {
  const { t, locale } = useAppCopy();
  const { dir } = useI18n();
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month, locale) }));
  return <div className="h-72 w-full" dir="ltr">
    <ResponsiveContainer>
      <BarChart data={dir === "rtl" ? [...rows].reverse() : rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <defs>
          <linearGradient id="g-rev" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="var(--navy)" /><stop offset="60%" stopColor="var(--steel)" /><stop offset="100%" stopColor="var(--navy)" /></linearGradient>
          <linearGradient id="g-exp" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="var(--taupe)" /><stop offset="60%" stopColor="var(--champagne)" /><stop offset="100%" stopColor="var(--taupe)" /></linearGradient>
          <filter id="depth" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="3" dy="4" stdDeviation="2.5" floodColor="var(--navy)" floodOpacity="0.18" /></filter>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
        <YAxis orientation={dir === "rtl" ? "right" : "left"} width={64} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)} />
        <Tooltip cursor={{ fill: "var(--cloud)", opacity: 0.3 }} formatter={(v: number) => formatAmount(v, currency)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name={t.revenue} fill="url(#g-rev)" filter="url(#depth)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" name={t.expenses} fill="url(#g-exp)" filter="url(#depth)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function CategoryChart({ data, currency }: { data: { category: string; amount: number }[]; currency: string }) {
  const { locale } = useI18n();
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((s, c) => s + c.amount, 0);
  const rows = (rest > 0 ? [...top, { category: "…", amount: rest }] : top).map((c) => ({ ...c, label: categoryLabel(c.category, locale) }));
  const total = rows.reduce((s, c) => s + c.amount, 0);
  return <div className="grid items-center gap-4 sm:grid-cols-2">
    <div className="h-52" dir="ltr">
      <ResponsiveContainer>
        <PieChart>
          <defs><filter id="pie-depth"><feDropShadow dx="0" dy="5" stdDeviation="3" floodColor="var(--navy)" floodOpacity="0.2" /></filter></defs>
          <Pie data={rows} dataKey="amount" nameKey="label" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} filter="url(#pie-depth)">
            {rows.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => formatAmount(v, currency)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <ul className="space-y-2 text-sm">
      {rows.map((c, i) => <li key={c.category} className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: PIE[i % PIE.length] }} aria-hidden="true" /><span className="truncate">{c.label}</span></span>
        <span className="num shrink-0 text-muted-foreground">{formatAmount(c.amount, currency)} · {((c.amount / total) * 100).toFixed(1)}%</span>
      </li>)}
    </ul>
  </div>;
}
