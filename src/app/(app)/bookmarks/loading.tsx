export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-32 rounded bg-surface" />
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-surface p-3">
            <div className="h-[72px] w-[88px] shrink-0 rounded-xl bg-border" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
