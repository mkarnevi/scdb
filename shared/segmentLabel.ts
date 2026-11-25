import { show_format_type } from "./enums";

const labels: Record<show_format_type, { singular: string; plural: string }> = {
  [show_format_type.Sketch]: { singular: "Sketch", plural: "Sketches" },
  [show_format_type.Panel]: { singular: "Round", plural: "Rounds" },
};

/**
 * What a show's segments are called: "Sketch" for sketch shows and "Round"
 * for panel shows. Internally every segment is still a `sketch` row; this
 * only changes the words people see. Unknown formats read as sketches.
 */
export function segmentLabel(
  format: show_format_type | `${show_format_type}` | null | undefined,
  options: { plural?: boolean; lowercase?: boolean } = {},
): string {
  const entry =
    labels[(format as show_format_type) ?? show_format_type.Sketch] ??
    labels[show_format_type.Sketch];
  const label = options.plural ? entry.plural : entry.singular;
  return options.lowercase ? label.toLowerCase() : label;
}
