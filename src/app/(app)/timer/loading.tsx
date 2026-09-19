export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="h-9 w-28 rounded-full bg-surface" />
        <div className="flex gap-2">
          <div className="h-[38px] w-[38px] rounded-xl bg-surface" />
          <div className="h-[38px] w-[38px] rounded-xl bg-surface" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-surface" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-1/3 rounded bg-surface" />
              <div className="h-7 w-1/2 rounded bg-surface" />
            </div>
            <div className="h-11 w-11 shrink-0 rounded-full bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
