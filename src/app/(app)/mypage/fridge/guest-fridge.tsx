"use client";

import { useState } from "react";
import { buildFridgeCategories } from "@/lib/fridgeCategories";
import { useGuestData } from "@/lib/guest/store";
import { FridgeEditor } from "./fridge-editor";

export function GuestFridge() {
  const { data, ready } = useGuestData();
  // The editor keeps its own working copy and writes changes as they happen,
  // so it only needs the on-device fridge once, when it first mounts.
  const [initial] = useState(() => (ready ? buildFridgeCategories(data.fridge) : null));

  if (!ready) return null;
  return <FridgeEditor categories={initial ?? buildFridgeCategories(data.fridge)} guest />;
}
