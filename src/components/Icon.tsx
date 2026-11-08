// A small inline icon set (stroke icons, 24px grid) so we don't ship an icon library.
const paths = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5z",
  plus: "M12 5v14M5 12h14",
  heart: "M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  check: "m5 12.5 4.5 4.5L19 7",
  shield: "M12 3 4.5 6v5.5c0 4.5 3.2 8.3 7.5 9.5 4.3-1.2 7.5-5 7.5-9.5V6zm-3 9 2 2 4-4",
  send: "m21 3-9.5 9.5M21 3l-6.5 18-3-8.5L3 9.5z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  filter: "M4 5h16M7 12h10M10 19h4",
  x: "M6 6l12 12M18 6 6 18",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  pin: "M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 1 1 13 0c0 5.3-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  image: "M4 5h16v14H4zM4 16l4.5-4.5 4 4L15 13l5 5M15.5 9.5h.01",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9S9.5 5.7 12 3Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2",
  laptop: "M5 6h14v9H5zM3 18h18",
  book: "M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zm0 13a3 3 0 0 1 3-3h9",
  shirt: "M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3c0 1.7-1.8 3-4 3S8 5.7 8 4Z",
  watch: "M9 3h6l1 4H8zm-1 14h8l-1 4H9zM12 9v3l2 1m4-1a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
  sofa: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h18v6H3zm2 6v2m14-2v2",
  wrench: "M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-2.5z",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  trash: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16zm9-13 4 4",
  tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export const categoryIcon: Record<string, IconName> = {
  electronics: "phone",
  computers: "laptop",
  "books-academic": "book",
  clothes: "shirt",
  accessories: "watch",
  furniture: "sofa",
  services: "wrench",
  other: "dots",
};
