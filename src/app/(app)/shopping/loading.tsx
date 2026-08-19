export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-[18px] h-[74px] rounded-2xl bg-surface" />
      <div className="mb-2 h-11 rounded-xl bg-surface" />
      <div className="flex flex-col gap-3 pt-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-5 w-2/3 rounded bg-surface" />
        ))}
      </div>
    </div>
  );
}
