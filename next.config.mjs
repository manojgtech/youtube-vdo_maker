import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  serverExternalPackages: ["@remotion/renderer", "@remotion/bundler"],
  outputFileTracingIncludes: {
    "/api/render": ["./src/remotion/**/*", "./public/**/*"],
  },
};

export default nextConfig;
