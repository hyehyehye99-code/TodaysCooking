"use client";

import { useState } from "react";
import Link from "next/link";
import { ChannelVideoPanel } from "./channel-video-importer";

// The row above 레시피 목록 — always "+ 새 레시피 추가" / "엑셀로 가져오기", plus
// "유튜브 영상 가져오기" when the creator's channel is YouTube, all sized as
// equal thirds (or halves without it) rather than the video-import button
// sitting on its own oddly-sized row underneath.
export function CreatorActionBar({
  creatorId,
  channelLink,
}: {
  creatorId: string;
  channelLink: string | null;
}) {
  const [videoPanelOpen, setVideoPanelOpen] = useState(false);
  const showYoutubeImport = !!channelLink;

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <Link
          href={`/admin/creators/${creatorId}/new`}
          className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-bold text-white"
        >
          + 새 레시피 추가
        </Link>
        <Link
          href="/admin/import"
          className="flex-1 rounded-xl border border-accent bg-white py-3 text-center text-sm font-bold text-accent-ink"
        >
          엑셀로 가져오기
        </Link>
        {showYoutubeImport && (
          <button
            type="button"
            onClick={() => setVideoPanelOpen((v) => !v)}
            className={`flex-1 rounded-xl border py-3 text-center text-sm font-bold ${
              videoPanelOpen ? "border-accent bg-accent text-white" : "border-accent bg-white text-accent-ink"
            }`}
          >
            유튜브 영상 가져오기
          </button>
        )}
      </div>

      {videoPanelOpen && channelLink && (
        <div className="mt-3">
          <ChannelVideoPanel creatorId={creatorId} channelLink={channelLink} onClose={() => setVideoPanelOpen(false)} />
        </div>
      )}
    </div>
  );
}
