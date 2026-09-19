export default function Loading() {
  return (
    <div className="animate-pulse pt-2">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-surface" />
          <div className="h-5 w-1/2 rounded-lg bg-surface" />
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-surface" />
      </div>

      <div className="flex flex-col items-center gap-2 py-8">
        <div className="h-14 w-40 rounded-lg bg-surface" />
        <div className="h-3 w-16 rounded bg-surface" />
      </div>

      <div className="mb-8 flex items-center justify-center gap-5">
        <div className="h-11 w-11 rounded-full bg-surface" />
        <div className="h-16 w-16 rounded-full bg-surface" />
        <div className="h-11 w-11" />
      </div>

      <div className="h-11 w-full rounded-xl bg-surface" />
    </div>
  );
}
