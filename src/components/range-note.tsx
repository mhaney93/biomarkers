import { getRangeNote } from "@/lib/range-notes";

// Short educational blurb on what being above or below the reference range can mean.
export function RangeNote({ biomarkerId, name }: { biomarkerId: string; name?: string }) {
  const note = getRangeNote(biomarkerId, name);
  if (!note) return null;
  return (
    <section aria-labelledby="range-note-heading" className="mt-10 border-t pt-6">
      <h2 id="range-note-heading" className="mb-3 text-sm font-semibold tracking-tight">
        What being outside the range can mean
      </h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs text-muted-foreground md:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">Above range</dt>
          <dd>{note.above}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Below range</dt>
          <dd>{note.below}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        General information only, not a diagnosis; causes vary from person to person.
      </p>
    </section>
  );
}
