import Link from "next/link";
import { notFound } from "next/navigation";
import { BiomarkerCard } from "@/components/biomarker-card";
import { getBiomarkersWithLatest } from "@/lib/biomarkers";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: encoded } = await params;
  const category = decodeURIComponent(encoded);

  const data = await getBiomarkersWithLatest();
  const items = data.filter((b) => b.category === category);

  if (items.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All biomarkers
      </Link>

      <h1 className="mb-8 text-2xl font-semibold tracking-tight">{category}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <BiomarkerCard key={b.id} b={b} showCategory={false} />
        ))}
      </div>
    </div>
  );
}
