// Reserved first-segment routes under /explore that are real subpages, not
// a meal plan id — kept in sync with the literal route folders.
const RESERVED_EXPLORE_SEGMENTS = new Set(["new"]);

// /explore/[id] is one meal plan's detail view — effectively the tab's own
// drill-in content, not a standalone subpage, so it keeps the tab bar/header
// chrome that /explore/new and /explore/[id]/edit (real subpages) hide.
export function isExploreDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/explore/")) return false;
  const rest = pathname
    .slice("/explore/".length)
    .split("/")
    .filter(Boolean);
  return rest.length === 1 && !RESERVED_EXPLORE_SEGMENTS.has(rest[0]);
}
