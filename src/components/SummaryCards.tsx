import type { DashboardStats, CategoryTotal } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";

interface Props {
  stats: DashboardStats;
  topCategory: CategoryTotal | undefined;
}

export default function SummaryCards({ stats, topCategory }: Props) {
  const change = stats.monthChange;
  const changeUp = change !== null && change > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total spending" value={formatCurrency(stats.total)} accent="from-brand-500 to-brand-700">
        Across {stats.count} {stats.count === 1 ? "expense" : "expenses"}
      </Card>

      <Card label="This month" value={formatCurrency(stats.thisMonth)} accent="from-sky-400 to-blue-600">
        {change === null ? (
          <span>No spending last month to compare</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span
              className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                changeUp ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {changeUp ? "▲" : "▼"} {Math.abs(change * 100).toFixed(0)}%
            </span>
            vs. {formatCurrency(stats.lastMonth)} last month
          </span>
        )}
      </Card>

      <Card
        label="Top category"
        value={topCategory ? `${CATEGORY_META[topCategory.category].icon} ${topCategory.category}` : "—"}
        accent="from-amber-400 to-orange-500"
      >
        {topCategory
          ? `${formatCurrency(topCategory.total)} · ${(topCategory.share * 100).toFixed(0)}% of all spending`
          : "No expenses yet"}
      </Card>

      <Card label="Daily average" value={formatCurrency(stats.avgPerDayThisMonth)} accent="from-emerald-400 to-teal-600">
        {stats.largest
          ? `Largest: ${formatCurrency(stats.largest.amount)} on ${formatDate(stats.largest.date)}`
          : "This month so far"}
      </Card>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 truncate text-xs text-slate-500">{children}</p>
    </div>
  );
}
