export default function Loading() {
  return (
    <div className="mx-auto max-w-[100rem] animate-pulse px-6 py-10" aria-busy="true">
      <div className="mb-6 h-4 w-40 rounded bg-muted" />
      <div className="mb-8 h-8 w-56 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
            <div className="mb-4 h-3 w-1/3 rounded bg-muted" />
            <div className="h-7 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
