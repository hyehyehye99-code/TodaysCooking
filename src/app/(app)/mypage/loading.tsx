export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-28 rounded-lg bg-surface" />
      <div className="mb-6 h-24 rounded-2xl bg-surface" />
      <div className="mb-3 h-4 w-20 rounded bg-surface" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
