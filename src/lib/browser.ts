import type { BrowserExecutable } from "@remotion/renderer";
import { existsSync } from "node:fs";

const CANDIDATES: string[] = [
  process.env.REMOTION_BROWSER_EXECUTABLE ?? "",
  ...(process.platform === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        `${process.env.LOCALAPPDATA ?? ""}\\Google\\Chrome\\Application\\chrome.exe`,
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/snap/bin/chromium",
        ]),
];

/**
 * Reuse a locally installed Chrome when we can. If not found, Remotion
 * downloads and manages its own Chrome Headless Shell on first render.
 */
export function getBrowserExecutable(): BrowserExecutable {
  for (const candidate of CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}
