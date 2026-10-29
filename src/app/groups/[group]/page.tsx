import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { BiomarkerCard } from "@/components/biomarker-card";
import { CategoryCard } from "@/components/category-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RenameGroupDialog } from "@/components/rename-group-dialog";
import { getBiomarkersWithLatest, getMaxDeltaPercent, groupItemsByCategory } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { GROUP_SCAN_IMAGES } from "@/lib/scan-images";
import { ScanImageLightbox } from "@/components/scan-image-lightbox";

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
  const scanImages = GROUP_SCAN_IMAGES[group] ?? [];

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <Breadcrumbs trail={[{ label: group }]} />

      <div className="mb-8 flex items-center gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{group}</h1>
        {authed && <RenameGroupDialog group={group} />}
      </div>

      {scanImages.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-4">
          {scanImages.map((img) => (
            <figure key={img.src} className="rounded-lg border bg-card p-3">
              <ScanImageLightbox img={img} />
              <figcaption className="mt-2 text-xs text-muted-foreground">
                {format(parseISO(img.takenAt), "MMM d, yyyy")}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

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
