import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "film"
  | "play"
  | "upload"
  | "trash"
  | "plus"
  | "arrow-up"
  | "arrow-down"
  | "sparkles"
  | "download"
  | "x"
  | "image"
  | "music"
  | "check"
  | "loader"
  | "external"
  | "refresh"
  | "clock"
  | "wand"
  | "chevron-down";

const paths: Record<IconName, ReactNode> = {
  film: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  upload: (
    <>
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "arrow-up": <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  "arrow-down": <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  sparkles: (
    <>
      <path d="M12 3.5 13.7 9l5.3 1.8-5.3 1.9L12 18l-1.7-5.3L5 10.8 10.3 9 12 3.5Z" />
      <path d="M18.5 15.5 19.2 18l2.3.8-2.3.8-.7 2.4-.7-2.4-2.3-.8 2.3-.8.7-2.5Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12M7.5 11.5 12 16l4.5-4.5" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m3.5 17 5-4.5 4 3.5 3-2.5 5 4.5" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5.5l10-2v12" />
      <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
      <ellipse cx="16.5" cy="15.5" rx="2.5" ry="2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 6.5" />,
  loader: <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.2 6.4" />
      <path d="M20 4v7h-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  wand: (
    <>
      <path d="M4 20 15.5 8.5" />
      <path d="M14 4.5 15 7l2.5 1-2.5 1-1 2.5-1-2.5L10.5 8 13 7l1-2.5Z" />
      <path d="M19 15.5 19.6 17l1.4.5-1.4.6L19 19.5l-.6-1.4-1.4-.6 1.4-.5.6-1.5Z" />
    </>
  ),
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
};

export function Icon({
  name,
  size = 18,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
    >
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#ff6a3d" />
      <rect
        x="8.5"
        y="11.5"
        width="23"
        height="17"
        rx="3.5"
        stroke="#0a0a0d"
        strokeWidth="1.8"
      />
      <path d="M8.5 17h23M8.5 23h23M14 11.5v17M26 11.5v17" stroke="#0a0a0d" strokeWidth="1.2" opacity=".7" />
      <path d="m18 16.5 5.5 3.5-5.5 3.5v-7Z" fill="#0a0a0d" />
    </svg>
  );
}
