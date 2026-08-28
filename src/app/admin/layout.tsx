export const metadata = {
  title: "관리자",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh overflow-y-auto overscroll-contain bg-surface">{children}</div>;
}
