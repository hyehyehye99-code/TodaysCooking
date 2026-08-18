import { loadGuestData, saveGuestData, type GuestData } from "./storage";

const listeners = new Set<() => void>();
let cached: GuestData | null = null;

const SERVER_SNAPSHOT: GuestData = { recipes: [], fridge: {}, bookmarks: [], shopping: [] };

function getSnapshot(): GuestData {
  if (cached === null) cached = loadGuestData();
  return cached;
}

function getServerSnapshot(): GuestData {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setGuestData(data: GuestData) {
  cached = data;
  saveGuestData(data);
  listeners.forEach((l) => l());
}

export const guestStore = { getSnapshot, getServerSnapshot, subscribe, setGuestData };
