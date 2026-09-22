"use client";

import { useState } from "react";
import { DefaultMascot } from "@/components/Mascot";

export function RecipeThumb({
  coverPhotoUrl,
  iconEmoji,
  linkThumbnailUrl,
  seed,
  size = 56,
  rounded = "rounded-2xl",
}: {
  coverPhotoUrl?: string | null;
  iconEmoji?: string | null;
  linkThumbnailUrl?: string | null;
  // Picks which mascot shows when the recipe has no photo/emoji/link image —
  // pass the recipe id so it stays the same character every time.
  seed?: string;
  size?: number;
  // Every caller used to get the same rounded-2xl corners — most still do,
  // but 탐색 wants a squarer look without changing everyone else's.
  rounded?: string;
}) {
  // Scraped Instagram/YouTube thumbnail URLs are signed and expire, so a
  // recipe saved a while back can point at a now-dead image — without this,
  // that renders the browser's broken-image glyph instead of falling
  // through to the next thing this recipe actually has (an emoji, or the
  // generic icon).
  const [coverFailed, setCoverFailed] = useState(false);
  const [linkFailed, setLinkFailed] = useState(false);
  const style = { width: size, height: size };

  if (coverPhotoUrl && !coverFailed) {
    return (
      <div style={style} className={`shrink-0 overflow-hidden ${rounded} bg-surface`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverPhotoUrl} alt="" className="h-full w-full object-cover" onError={() => setCoverFailed(true)} />
      </div>
    );
  }
  if (iconEmoji) {
    return (
      <div
        style={{ ...style, fontSize: size * 0.42 }}
        className={`flex shrink-0 items-center justify-center ${rounded} bg-surface`}
      >
        {iconEmoji}
      </div>
    );
  }
  if (linkThumbnailUrl && !linkFailed) {
    return (
      <div style={style} className={`shrink-0 overflow-hidden ${rounded} bg-surface`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={linkThumbnailUrl} alt="" className="h-full w-full object-cover" onError={() => setLinkFailed(true)} />
      </div>
    );
  }
  return (
    <div style={style} className={`flex shrink-0 items-center justify-center ${rounded} bg-surface`}>
      <DefaultMascot pool="recipe" seed={seed ?? "recipe"} box={size} />
    </div>
  );
}
