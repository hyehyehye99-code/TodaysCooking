"use client";

import { startTransition, useEffect, useState } from "react";

const TRANSITION_MS = 220;

// Every popup in the app was a raw {open && <div className="fixed inset-0">}
// — instant appear, instant disappear, no exit animation at all. This keeps
// the element mounted for one extra transition while it fades/slides out,
// so closing feels as deliberate as opening.
export function Modal({
  open,
  onClose,
  variant,
  children,
}: {
  open: boolean;
  onClose: () => void;
  variant: "sheet" | "center";
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      startTransition(() => setMounted(true));
      const raf = requestAnimationFrame(() => startTransition(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    startTransition(() => setVisible(false));
    const timeout = setTimeout(() => startTransition(() => setMounted(false)), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${variant === "sheet" ? "items-end" : "items-center px-6"}`}
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity ease-out"
        style={{ transitionDuration: `${TRANSITION_MS}ms`, opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="relative w-full transition-all ease-out"
        style={{
          transitionDuration: `${TRANSITION_MS}ms`,
          transform:
            variant === "sheet"
              ? `translateY(${visible ? 0 : 100}%)`
              : `scale(${visible ? 1 : 0.95})`,
          opacity: variant === "center" ? (visible ? 1 : 0) : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
