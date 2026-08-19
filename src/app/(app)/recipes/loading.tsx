export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-surface" />
        <div className="h-5 w-16 rounded-lg bg-surface" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-surface p-3">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-border" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-2/3 rounded bg-border" />
              <div className="h-3 w-1/3 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
