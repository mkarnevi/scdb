/**
 * Helpers for segment timestamps. Times are stored as whole seconds and
 * shown to editors and viewers as timecodes ("1:23:45", "4:05", "75").
 */

/**
 * Parses "H:MM:SS", "M:SS" or plain seconds into whole seconds.
 * Returns null for empty input and NaN for anything malformed.
 */
export function parseTimecode(input: string): number | null {
  const text = input.trim();
  if (!text) return null;

  const parts = text.split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return NaN;

  const numbers = parts.map((p) => parseInt(p, 10));
  // Minutes and seconds after the first part must be below 60
  if (numbers.slice(1).some((n) => n >= 60)) return NaN;

  return numbers.reduce((total, n) => total * 60 + n, 0);
}

/** Formats seconds as "M:SS", or "H:MM:SS" from an hour upwards */
export function formatTimecode(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Returns an error message if a segment's start and end don't make sense */
export function validateSegmentTimes(
  start: number | null | undefined,
  end: number | null | undefined,
): string | null {
  if (start != null && (!Number.isInteger(start) || start < 0)) {
    return "Segment start must be zero or more whole seconds";
  }
  if (end != null && (!Number.isInteger(end) || end <= 0)) {
    return "Segment end must be more than zero whole seconds";
  }
  if (start != null && end != null && end <= start) {
    return "Segment end must be after its start";
  }
  return null;
}
