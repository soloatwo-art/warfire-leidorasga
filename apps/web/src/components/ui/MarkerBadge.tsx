import { MARKER_TAG_COLORS, MARKER_TAG_LABELS, MarkerTag } from "@warfire/shared";

export function MarkerBadge({ tag }: { tag: MarkerTag | null | undefined }) {
  if (!tag) return null;
  const color = MARKER_TAG_COLORS[tag];

  return (
    <span
      className="badge"
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      {MARKER_TAG_LABELS[tag]}
    </span>
  );
}
