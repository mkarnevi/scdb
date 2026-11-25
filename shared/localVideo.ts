/**
 * Local video support: files served from your own server (for example by
 * Caddy or nginx next to the app) rather than embedded from a video site.
 *
 * A URL counts as local when it is a path on this site ("/media/ep1.mp4")
 * or any http(s) URL that points straight at a video file.
 */

const VIDEO_FILE_EXTENSIONS = [".mp4", ".m4v", ".webm", ".mov", ".ogv"];

export function isLocalVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const path = parsed.pathname.toLowerCase();
    return VIDEO_FILE_EXTENSIONS.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

/** Short label for a video URL, e.g. for source buttons and chips */
export function videoSourceLabel(url: string): string {
  if (isLocalVideoUrl(url)) return "Local file";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Error parsing URL";
  }
}

/** A segment of a video file, e.g. one round inside a full episode */
export interface VideoSegment {
  id: number;
  title: string;
  url_slug: string;
  start_seconds: number | null;
  end_seconds: number | null;
  video_urls: string[];
}

/** What to play: where the current segment sits and what else is in the file */
export interface VideoPlayback {
  startSeconds?: number | null;
  endSeconds?: number | null;
  currentSegmentId?: number;
  /** Other segments of the same episode; only those sharing the file show */
  segments?: VideoSegment[];
  /** "Sketch" or "Round", from segmentLabel() */
  segmentLabel?: string;
}

/**
 * The episode's segments that live in the given video file and have a start
 * time, in playback order. These become markers on the progress bar.
 */
export function segmentsInVideo(
  url: string,
  segments: VideoSegment[] | undefined,
): (VideoSegment & { start_seconds: number })[] {
  return (segments ?? [])
    .filter(
      (s): s is VideoSegment & { start_seconds: number } =>
        s.start_seconds != null && s.video_urls.includes(url),
    )
    .sort((a, b) => a.start_seconds - b.start_seconds);
}
