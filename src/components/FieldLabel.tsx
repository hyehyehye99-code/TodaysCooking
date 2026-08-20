export function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-3 text-[13px] font-bold">
      {children}
      <span className={`ml-1.5 text-[11px] font-semibold ${required ? "text-accent" : "text-ink-faint"}`}>
        {required ? "필수" : "선택"}
      </span>
    </p>
  );
}
