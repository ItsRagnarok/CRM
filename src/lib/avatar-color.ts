const PALETTE = [
  { bg: "#EFF4FF", text: "#2F6FED" },
  { bg: "#F5F3FF", text: "#6D28D9" },
  { bg: "#FEF9EC", text: "#B45309" },
  { bg: "#FEF3F2", text: "#B91C1C" },
  { bg: "#F0FDF4", text: "#15803D" },
  { bg: "#F2F4F7", text: "#667085" },
];

/** Stable color per id, so a row keeps its color across reloads/filters. */
export function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
