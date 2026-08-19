export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-7 w-20 rounded-lg bg-surface" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-3.5 w-16 rounded bg-surface" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-8 w-16 rounded-full bg-surface" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
