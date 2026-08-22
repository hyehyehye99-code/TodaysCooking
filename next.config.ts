import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Recipe photos are resized/compressed client-side before upload (see
  // PhotoPicker), but this is a safety net: the default 1MB limit rejects
  // the request before the server action even runs, which crashed the app
  // with no inline error when an unprocessed camera photo slipped through.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Dynamic pages default to 0s client-router-cache staleTime (Next 15+),
    // so switching tabs and back always re-fetches from scratch even a
    // second later. A short window lets that feel instant while a mutation
    // anywhere still calls revalidatePath, which invalidates this cache
    // immediately regardless of staleTime — so it never shows data that's
    // stale relative to something the user (or another household member,
    // once they revisit) just changed themselves.
    staleTimes: {
      dynamic: 15,
    },
  },
};

export default nextConfig;
