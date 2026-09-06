// Reserved first-segment routes under /explore that are real subpages, not
// a meal plan id — kept in sync with the literal route folders.
const RESERVED_EXPLORE_SEGMENTS = new Set(["new", "list"]);

// /explore/[id] is the swipeable meal-plan carousel — effectively the tab's
// own home content, not a drill-in subpage, so it keeps the tab bar/header
// chrome that /explore/new, /explore/list and /explore/[id]/edit (real
// subpages) hide.
export function isExploreDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/explore/")) return false;
  const rest = pathname
    .slice("/explore/".length)
    .split("/")
    .filter(Boolean);
  return rest.length === 1 && !RESERVED_EXPLORE_SEGMENTS.has(rest[0]);
}
