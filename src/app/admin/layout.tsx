export const metadata = {
  title: "관리자",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-y-auto overscroll-contain bg-surface">
      <div className="mx-auto w-full max-w-[720px] px-5 py-8">{children}</div>
    </div>
  );
}
