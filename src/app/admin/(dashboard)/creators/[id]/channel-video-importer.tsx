"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  adminFetchChannelVideos,
  adminAddRecipeFromChannelVideo,
  type ChannelVideoWithStatus,
} from "@/lib/actions/creator-channel";

type VideoResult =
  | { status: "success"; recipeId: string }
  | { status: "skipped"; message: string }
  | { status: "error"; message: string };

export function ChannelVideoPanel({
  creatorId,
  channelLink,
  onClose,
}: {
  creatorId: string;
  channelLink: string;
  onClose: () => void;
}) {
  const [videos, setVideos] = useState<ChannelVideoWithStatus[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, VideoResult>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const stopRef = useRef(false);

  const selectableVideos = useMemo(
    () => videos.filter((v) => !v.alreadyAdded && results[v.videoId]?.status !== "success"),
    [videos, results]
  );
  const allSelected = selectableVideos.length > 0 && selectableVideos.every((v) => selected.has(v.videoId));

  async function load(pageToken?: string) {
    setError(null);
    setLoading(true);
    const result = await adminFetchChannelVideos(creatorId, channelLink, pageToken);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setVideos((prev) => (pageToken ? [...prev, ...result.videos] : result.videos));
    setNextPageToken(result.nextPageToken);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
    // Only ever runs once, when the panel first mounts (it's only rendered
    // while open) — channelLink/creatorId don't change without a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelected(videoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(selectableVideos.map((v) => v.videoId)));
  }

  async function handleCopy(url: string, videoId: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(videoId);
      setTimeout(() => setCopiedId((id) => (id === videoId ? null : id)), 1500);
    } catch {
      // clipboard permission can be denied — the link is still visible to copy by hand
    }
  }

  async function handleBulkAdd() {
    const targets = videos.filter((v) => selected.has(v.videoId));
    if (targets.length === 0) return;

    stopRef.current = false;
    setRunning(true);
    setProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      if (stopRef.current) break;
      const v = targets[i];
      const result = await adminAddRecipeFromChannelVideo(creatorId, { url: v.url, title: v.title });
      setResults((prev) => ({
        ...prev,
        [v.videoId]: result.ok
          ? { status: "success", recipeId: result.id }
          : { status: result.skipped ? "skipped" : "error", message: result.error },
      }));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(v.videoId);
        return next;
      });
      setProgress((p) => ({ ...p, done: i + 1 }));
    }
    setRunning(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold">채널 영상 목록{videos.length > 0 ? ` (${videos.length})` : ""}</p>
        <button type="button" onClick={onClose} className="text-xs font-bold text-ink-faint">
          닫기
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-warn-ink">{error}</p>}
      {loading && videos.length === 0 && <p className="text-xs text-ink-soft">불러오는 중...</p>}

      {videos.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={selectableVideos.length === 0 || running}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-soft disabled:opacity-50"
            >
              {allSelected ? "전체 해제" : "전체 선택"}
            </button>
            <span className="text-[11px] font-semibold text-ink-faint">{selected.size}개 선택됨</span>

            <div className="ml-auto flex items-center gap-2">
              {running ? (
                <>
                  <span className="text-[11px] font-semibold text-ink-soft">
                    {progress.done}/{progress.total} 처리 중...
                  </span>
                  <button
                    type="button"
                    onClick={() => (stopRef.current = true)}
                    className="shrink-0 rounded-lg border border-warn bg-white px-3 py-2 text-[11px] font-bold text-warn-ink"
                  >
                    중단
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={selected.size === 0}
                  className="shrink-0 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  선택한 {selected.size}개 AI로 일괄 추가
                </button>
              )}
            </div>
          </div>

          {running && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {videos.map((v) => {
              const result = results[v.videoId];
              const done = v.alreadyAdded || result?.status === "success";
              return (
                <div
                  key={v.videoId}
                  className={`flex items-center gap-2.5 rounded-xl bg-surface p-2 ${done ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(v.videoId)}
                    onChange={() => toggleSelected(v.videoId)}
                    disabled={done || running}
                    className="h-[18px] w-[18px] shrink-0 accent-accent disabled:opacity-40"
                  />
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="h-11 w-[72px] shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-11 w-[72px] shrink-0 rounded-lg bg-border" />
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs font-semibold text-ink hover:underline"
                    >
                      {v.title}
                    </a>
                    {v.publishedAt && (
                      <p className="text-[11px] text-ink-faint">{new Date(v.publishedAt).toLocaleDateString("ko-KR")}</p>
                    )}
                  </div>

                  {v.alreadyAdded ? (
                    <span className="shrink-0 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-bold text-ink-faint">
                      추가됨
                    </span>
                  ) : result?.status === "success" ? (
                    <Link
                      href={`/admin/creators/${creatorId}/${result.recipeId}/edit`}
                      className="shrink-0 rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive-ink"
                    >
                      ✓ 추가됨
                    </Link>
                  ) : result?.status === "skipped" ? (
                    <span
                      title={result.message}
                      className="shrink-0 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-bold text-ink-faint"
                    >
                      건너뜀
                    </span>
                  ) : result?.status === "error" ? (
                    <span
                      title={result.message}
                      className="shrink-0 rounded-full bg-warn/10 px-2.5 py-1 text-[11px] font-bold text-warn-ink"
                    >
                      오류
                    </span>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(v.url, v.videoId)}
                        className="rounded-lg bg-white px-2 py-1.5 text-[11px] font-bold text-ink-soft"
                      >
                        {copiedId === v.videoId ? "복사됨" : "복사"}
                      </button>
                      <Link
                        href={`/admin/creators/${creatorId}/new?url=${encodeURIComponent(v.url)}`}
                        className="rounded-lg bg-accent px-2 py-1.5 text-[11px] font-bold text-white"
                      >
                        레시피로
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {nextPageToken && (
        <button
          type="button"
          onClick={() => load(nextPageToken)}
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-surface py-2 text-xs font-bold text-ink-soft disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "더 불러오기"}
        </button>
      )}
    </div>
  );
}
