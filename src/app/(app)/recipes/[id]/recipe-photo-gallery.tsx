"use client";

import { useState } from "react";

export function RecipePhotoGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) return null;

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="mb-4">
      <div
        onScroll={handleScroll}
        className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="h-full w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === active ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
