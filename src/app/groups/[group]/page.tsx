import Link from "next/link";
import { notFound } from "next/navigation";
import { BiomarkerCard } from "@/components/biomarker-card";
import { CategoryCard } from "@/components/category-card";
import { RenameGroupDialog } from "@/components/rename-group-dialog";
import { getBiomarkersWithLatest, getMaxDeltaPercent, groupItemsByCategory } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: encoded } = await params;
  const group = decodeURIComponent(encoded);

  const [data, authed] = await Promise.all([getBiomarkersWithLatest(), isAuthed()]);
  const items = data.filter((b) => b.group === group);
  const maxPercent = getMaxDeltaPercent(data);

  if (items.length === 0) notFound();

  const { categories, standalone } = groupItemsByCategory(items);

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All biomarkers
      </Link>

      <div className="mb-8 flex items-center gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{group}</h1>
        {authed && <RenameGroupDialog group={group} />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {categories.map(({ category, items }) => (
          <CategoryCard
            key={category}
            category={category}
            items={items}
            href={`/groups/${encodeURIComponent(group)}/categories/${encodeURIComponent(category)}`}
          />
        ))}
        {standalone.map((b) => (
          <BiomarkerCard key={b.id} b={b} maxPercent={maxPercent} />
        ))}
      </div>
    </div>
  );
}
