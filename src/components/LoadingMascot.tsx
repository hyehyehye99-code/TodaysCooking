import { Mascot, type MascotName } from "@/components/Mascot";

// Floats over a page's loading skeleton so waiting has a face on it.
export function LoadingMascot({ name }: { name: MascotName }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[38%] z-10 flex justify-center">
      <Mascot name={name} size={92} className="animate-bob drop-shadow-sm" />
    </div>
  );
}
