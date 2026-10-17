const paths = {
  home: "m3 10 9-7 9 7v10H15v-7H9v7H3Z",
  tasks: "M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01",
  check: "m5 12 4 4L19 6",
  folder: "M3 7V4h6l2 3h10v13H3Z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  chart: "M4 3v17h17M8 7h9M8 12h13M8 17h6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  board: "M3 4h18v16H3zM9 4v16M15 4v16M5 8h2M11 8h2M17 8h2M5 12h2",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  plus: "M12 5v14M5 12h14",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01",
  link: "m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
  flag: "M5 21V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0",
  filter: "M4 6h16M7 12h10M10 18h4",
  close: "m6 6 12 12M6 18 18 6",
  panel: "M3 4h18v16H3zM9 4v16",
  people:
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM2 21v-3a7 7 0 0 1 14 0v3M17 4a4 4 0 0 1 0 8M18 15a5 5 0 0 1 4 5",
  external: "M14 3h7v7M21 3 10 14M10 3H4v17h17v-6",
  refresh: "M20 7a9 9 0 1 0 1 9M20 2v6h-6",
  file: "M14 2H4v20h16V8ZM14 2v6h6M8 13h8M8 17h5",
  inbox: "M5 4h14l3 10v6H2v-6ZM2 14h6l2 3h4l2-3h6",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
