import Link from "next/link";
import { notFound } from "next/navigation";
import { BiomarkerCard } from "@/components/biomarker-card";
import { AddBiomarkerDialog } from "@/components/add-biomarker-dialog";
import { UnlockDialog } from "@/components/unlock-dialog";
import { getBiomarkersWithLatest } from "@/lib/biomarkers";
import { isAuthed } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GroupCategoryPage({
  params,
}: {
  params: Promise<{ group: string; category: string }>;
}) {
  const { group: groupEncoded, category: categoryEncoded } = await params;
  const group = decodeURIComponent(groupEncoded);
  const category = decodeURIComponent(categoryEncoded);

  const [data, authed] = await Promise.all([getBiomarkersWithLatest(), isAuthed()]);
  const items = data.filter((b) => b.group === group && b.category === category);

  if (items.length === 0) notFound();

  return (
    <div className="mx-auto max-w-[100rem] px-6 py-10">
      <Link
        href={`/groups/${encodeURIComponent(group)}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {group}
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{category}</h1>
        {authed ? (
          <AddBiomarkerDialog defaultCategory={category} defaultGroup={group} />
        ) : (
          <UnlockDialog />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((b) => (
          <BiomarkerCard key={b.id} b={b} showCategory={false} />
        ))}
      </div>
    </div>
  );
}
