export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
            <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-surface" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-2/3 rounded bg-surface" />
              <div className="h-3 w-1/3 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
