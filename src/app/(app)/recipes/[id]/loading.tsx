export default function Loading() {
  return (
    <div className="animate-pulse pt-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-surface" />
          <div className="h-6 w-2/3 rounded-lg bg-surface" />
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-surface" />
      </div>

      <div className="mb-4 aspect-square w-full rounded-2xl bg-surface" />

      <div className="h-3 w-24 rounded bg-surface" />

      <div className="mt-5">
        <div className="mb-2 h-4 w-32 rounded bg-surface" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-16 rounded-full bg-surface" />
          ))}
        </div>
      </div>

      <div className="mt-4 h-11 w-full rounded-xl bg-surface" />

      <div className="mt-6">
        <div className="mb-2 h-4 w-20 rounded bg-surface" />
        <div className="h-24 w-full rounded-2xl bg-surface" />
      </div>
    </div>
  );
}
