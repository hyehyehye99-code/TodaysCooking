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
      {required && <span className="ml-1.5 text-[11px] font-semibold text-accent">필수</span>}
    </p>
  );
}
