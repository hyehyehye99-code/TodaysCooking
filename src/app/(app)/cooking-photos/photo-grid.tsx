"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CookLog } from "@/lib/types";

type LogWithRecipe = CookLog & { recipes: { title: string } | null };

function PhotoCard({ log }: { log: LogWithRecipe }) {
  return (
    <Link href={`/recipes/${log.recipe_id}`} className="block">
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={log.photo_url} alt="" className="h-36 w-full object-cover" />
        <div className="px-2.5 py-2">
          <p className="truncate text-xs font-bold">{log.recipes?.title ?? "레시피"}</p>
          <div className="mt-0.5 flex items-center justify-between">
            <p className="text-[11px] text-ink-faint">{log.cooked_at}</p>
            {log.rating && <p className="text-[11px] text-warn-ink">{"★".repeat(log.rating)}</p>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CookingPhotoGrid({ logs }: { logs: LogWithRecipe[] }) {
  const [sortBy, setSortBy] = useState<"date" | "recipe">("date");

  const grouped = useMemo(() => {
    if (sortBy === "date") return null;
    const groups = new Map<string, LogWithRecipe[]>();
    for (const log of logs) {
      const title = log.recipes?.title ?? "레시피";
      groups.set(title, [...(groups.get(title) ?? []), log]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [logs, sortBy]);

  return (
    <div>
      <div className="mb-4 flex rounded-xl border border-transparent bg-surface p-1">
        <button
          type="button"
          onClick={() => setSortBy("date")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold ${sortBy === "date" ? "bg-accent text-white" : "text-ink-soft"}`}
        >
          날짜순
        </button>
        <button
          type="button"
          onClick={() => setSortBy("recipe")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold ${sortBy === "recipe" ? "bg-accent text-white" : "text-ink-soft"}`}
        >
          요리별
        </button>
      </div>

      {sortBy === "date" ? (
        <div className="grid grid-cols-2 gap-3">
          {logs.map((log) => (
            <PhotoCard key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped!.map(([title, items]) => (
            <div key={title}>
              <p className="mb-2.5 text-sm font-bold">
                {title} <span className="text-xs font-normal text-ink-faint">{items.length}장</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {items.map((log) => (
                  <PhotoCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
