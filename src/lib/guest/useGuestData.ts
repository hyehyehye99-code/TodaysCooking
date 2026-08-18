"use client";

import { useCallback, useSyncExternalStore } from "react";
import { guestStore } from "./store";
import type { GuestData } from "./storage";

export function useGuestData() {
  const data = useSyncExternalStore(
    guestStore.subscribe,
    guestStore.getSnapshot,
    guestStore.getServerSnapshot
  );

  const update = useCallback((updater: (prev: GuestData) => GuestData) => {
    guestStore.setGuestData(updater(guestStore.getSnapshot()));
  }, []);

  return { data, update, hydrated: true };
}
