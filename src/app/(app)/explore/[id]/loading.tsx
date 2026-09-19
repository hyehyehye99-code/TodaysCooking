export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <div className="mb-3 h-6 w-2/3 rounded-lg bg-surface" />
        <div className="mb-4 h-3 w-1/3 rounded bg-surface" />
        <div className="flex gap-3">
          <div className="h-11 flex-1 rounded-xl bg-surface" />
          <div className="h-11 flex-1 rounded-xl bg-surface" />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="mb-6 rounded-2xl border border-border bg-white p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-surface" />
            <div className="h-9 w-9 shrink-0 rounded-xl bg-surface" />
            <div className="h-5 w-1/3 rounded bg-surface" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-9 w-20 rounded-full bg-surface" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
