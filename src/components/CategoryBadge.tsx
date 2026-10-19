import type { Category } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";

export default function CategoryBadge({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span aria-hidden>{meta.icon}</span>
      {category}
    </span>
  );
}
