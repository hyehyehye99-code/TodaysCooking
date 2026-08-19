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
  },
};

export default nextConfig;
