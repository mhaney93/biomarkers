import { findTerms } from "@/lib/glossary";

// "Terms on this page": defines every abbreviation, unit and technical term found in the
// strings the page renders. Pass the same names/units/notes the page shows.
export function TermsKey({ texts }: { texts: Iterable<string | null | undefined> }) {
  const terms = findTerms(texts);
  if (terms.length === 0) return null;
  return (
    <section aria-labelledby="terms-heading" className="mt-10 border-t pt-6">
      <h2 id="terms-heading" className="mb-3 text-sm font-semibold tracking-tight">
        Terms on this page
      </h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-xs text-muted-foreground md:grid-cols-2">
        {terms.map((t) => (
          <div key={t.term}>
            <dt className="inline font-medium text-foreground">{t.term}</dt>
            <dd className="inline"> — {t.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type TermSource = {
  name: string;
  unit: string | null;
  group?: string | null;
  category?: string | null;
  valueType?: string;
  latest?: { notes?: string | null } | null;
};

/** The strings a page shows for a set of biomarkers (plus the status/range words around them). */
export function biomarkerTexts(items: TermSource[], extra: string[] = []): string[] {
  const texts = [...extra];
  for (const b of items) {
    texts.push(b.name, b.unit ?? "", b.group ?? "", b.category ?? "", b.latest?.notes ?? "");
    if (b.unit === "kU/L" && /\bIgE$/.test(b.name)) texts.push("Class 0");
    if (b.valueType === "duration") texts.push("h:m");
    if (b.valueType !== "text") texts.push("Low In range High");
  }
  return texts;
}
