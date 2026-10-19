import type { Category } from "@/types/expense";

interface CategoryMeta {
  icon: string;
  /** Hex color used for charts */
  color: string;
  /** Tailwind classes for badges */
  badge: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: { icon: "🍔", color: "#f59e0b", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  Transportation: { icon: "🚗", color: "#3b82f6", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  Entertainment: { icon: "🎬", color: "#a855f7", badge: "bg-purple-50 text-purple-700 ring-purple-200" },
  Shopping: { icon: "🛍️", color: "#ec4899", badge: "bg-pink-50 text-pink-700 ring-pink-200" },
  Bills: { icon: "🧾", color: "#10b981", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  Other: { icon: "📦", color: "#64748b", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
};
