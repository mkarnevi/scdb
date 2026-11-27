import { describe, expect, test } from "vitest";
import {
  deriveVideoInfo,
  withYouTubeSegment,
} from "../app/components/VideoPlayer";
import { crossedSegmentEnd } from "../app/hooks/useVideoPlayer";
import * as generatedEnums from "../database/generated/enums";
import { cast_role_type, show_format_type } from "../shared/enums";
import {
  isLocalVideoUrl,
  segmentsInVideo,
  VideoSegment,
  videoSourceLabel,
} from "../shared/localVideo";
import { ShowInputSchema } from "../shared/schemas/entities";
import {
  SketchInputSchema,
  SketchUpdateInputSchema,
} from "../shared/schemas/sketch";
import { segmentLabel } from "../shared/segmentLabel";
import {
  formatTimecode,
  parseTimecode,
  validateSegmentTimes,
} from "../shared/timecode";

describe("timecodes", () => {
  test.each([
    ["75", 75],
    ["1:15", 75],
    ["12:34", 754],
    ["1:02:03", 3723],
    ["0:00", 0],
    ["  4:05 ", 245],
  ])("parses %j as %d seconds", (input, seconds) => {
    expect(parseTimecode(input)).toBe(seconds);
  });

  test("treats empty input as no value", () => {
    expect(parseTimecode("")).toBeNull();
    expect(parseTimecode("   ")).toBeNull();
  });

  test.each(["1:75", "1:2:3:4", "abc", "1.5", "-5", "1::2", "1:60"])(
    "rejects %j",
    (input) => {
      expect(parseTimecode(input)).toBeNaN();
    },
  );

  test.each([
    [0, "0:00"],
    [5, "0:05"],
    [754, "12:34"],
    [3600, "1:00:00"],
    [3723, "1:02:03"],
  ])("formats %d seconds as %s", (seconds, text) => {
    expect(formatTimecode(seconds)).toBe(text);
  });

  test("round-trips through format and parse", () => {
    for (const seconds of [0, 59, 60, 3599, 3600, 7322]) {
      expect(parseTimecode(formatTimecode(seconds))).toBe(seconds);
    }
  });
});

describe("segment time validation", () => {
  test("accepts sensible ranges and missing values", () => {
    expect(validateSegmentTimes(null, null)).toBeNull();
    expect(validateSegmentTimes(0, 90)).toBeNull();
    expect(validateSegmentTimes(120, null)).toBeNull();
    expect(validateSegmentTimes(null, 120)).toBeNull();
  });

  test("rejects an end at or before the start", () => {
    expect(validateSegmentTimes(90, 90)).toMatch(/after its start/);
    expect(validateSegmentTimes(90, 30)).toMatch(/after its start/);
  });

  test("rejects malformed values from the editor", () => {
    expect(validateSegmentTimes(NaN, null)).toMatch(/start/);
    expect(validateSegmentTimes(-1, null)).toMatch(/start/);
    expect(validateSegmentTimes(null, 0)).toMatch(/end/);
    expect(validateSegmentTimes(1.5, null)).toMatch(/start/);
  });
});

describe("segment labels", () => {
  test("sketch shows say sketch, panel shows say round", () => {
    expect(segmentLabel(show_format_type.Sketch)).toBe("Sketch");
    expect(segmentLabel(show_format_type.Panel)).toBe("Round");
    expect(segmentLabel("Panel", { plural: true })).toBe("Rounds");
    expect(segmentLabel("Sketch", { plural: true, lowercase: true })).toBe(
      "sketches",
    );
  });

  test("unknown or missing formats read as sketches", () => {
    expect(segmentLabel(null)).toBe("Sketch");
    expect(segmentLabel(undefined, { plural: true })).toBe("Sketches");
  });
});

describe("local video URLs", () => {
  test.each([
    "/media/panel/s01e01.mp4",
    "/media/anything",
    "https://media.example.home/episodes/ep1.mp4",
    "http://100.64.0.1:8080/videos/ep1.WEBM",
    "https://archive.example.com/clip.m4v?token=abc",
  ])("treats %s as local", (url) => {
    expect(isLocalVideoUrl(url)).toBe(true);
  });

  test.each([
    "https://www.youtube.com/watch?v=Brbrdnh74yA",
    "https://vimeo.com/123456",
    "https://archive.org/details/some-show",
    "//evil.example.com/ep1.mp4",
    "file:///Users/mike/ep1.mp4",
    "not a url",
  ])("does not treat %s as local", (url) => {
    expect(isLocalVideoUrl(url)).toBe(false);
  });

  test("labels sources without throwing on relative paths", () => {
    expect(videoSourceLabel("/media/ep1.mp4")).toBe("Local file");
    expect(videoSourceLabel("https://www.youtube.com/watch?v=x")).toBe(
      "youtube.com",
    );
  });

  test("local URLs go to the local player before other providers", () => {
    expect(deriveVideoInfo("/media/ep1.mp4")).toEqual({
      videoUrl: "/media/ep1.mp4",
      provider: "local",
    });
    expect(
      deriveVideoInfo("https://www.youtube.com/watch?v=Brbrdnh74yA").provider,
    ).toBe("youtube");
  });
});

describe("segments in a video", () => {
  const segment = (
    id: number,
    start: number | null,
    urls = ["/media/ep1.mp4"],
  ): VideoSegment => ({
    id,
    title: `Round ${id}`,
    url_slug: `round-${id}`,
    start_seconds: start,
    end_seconds: null,
    video_urls: urls,
  });

  test("keeps segments in the same file, in playback order", () => {
    const segments = [
      segment(3, 900),
      segment(1, 60),
      segment(2, 480, ["/media/ep2.mp4"]),
      segment(4, null),
      segment(5, 300),
    ];
    expect(
      segmentsInVideo("/media/ep1.mp4", segments).map((s) => s.id),
    ).toEqual([1, 5, 3]);
  });

  test("handles no segments", () => {
    expect(segmentsInVideo("/media/ep1.mp4", undefined)).toEqual([]);
  });
});

describe("segment end", () => {
  test("pauses only when playback crosses the end", () => {
    expect(crossedSegmentEnd(89.8, 90.1, 90)).toBe(true);
    expect(crossedSegmentEnd(90.1, 90.4, 90)).toBe(false); // already past
    expect(crossedSegmentEnd(10, 20, null)).toBe(false); // no end set
    expect(crossedSegmentEnd(10, 20, undefined)).toBe(false);
  });
});

describe("YouTube segments", () => {
  const embed = "https://www.youtube.com/embed/Brbrdnh74yA";

  test("adds start and end to embeds", () => {
    const url = new URL(
      withYouTubeSegment(embed, { startSeconds: 754, endSeconds: 1100 }),
    );
    expect(url.searchParams.get("start")).toBe("754");
    expect(url.searchParams.get("end")).toBe("1100");
  });

  test("leaves embeds alone without segment times", () => {
    expect(withYouTubeSegment(embed)).toBe(embed);
    expect(withYouTubeSegment(embed, { startSeconds: null })).toBe(embed);
  });
});

describe("API schemas", () => {
  test("shows default to the sketch format", () => {
    expect(ShowInputSchema.parse({ title: "8 Out of 10 Cats" }).format).toBe(
      "Sketch",
    );
    expect(
      ShowInputSchema.parse({ title: "8 Out of 10 Cats", format: "Panel" })
        .format,
    ).toBe("Panel");
    expect(() =>
      ShowInputSchema.parse({ title: "QI", format: "Quiz" }),
    ).toThrow();
  });

  test("segments accept start and end seconds", () => {
    const parsed = SketchInputSchema.parse({
      title: "Opening round",
      show_id: 1,
      start_seconds: 0,
      end_seconds: 540,
    });
    expect(parsed.start_seconds).toBe(0);
    expect(parsed.end_seconds).toBe(540);
    expect(() =>
      SketchUpdateInputSchema.parse({ start_seconds: -1 }),
    ).toThrow();
    expect(() => SketchUpdateInputSchema.parse({ end_seconds: 1.5 })).toThrow();
  });

  test("panel roles are accepted for cast", () => {
    for (const role of ["Captain", "Panellist"]) {
      expect(
        SketchUpdateInputSchema.parse({ cast: [{ person_id: 1, role }] })
          .cast?.[0].role,
      ).toBe(role);
    }
  });
});

describe("enums match the database schema", () => {
  test("cast roles", () => {
    expect(Object.values(cast_role_type).sort()).toEqual(
      Object.values(generatedEnums.cast_role_type).sort(),
    );
  });

  test("show formats", () => {
    expect(Object.values(show_format_type).sort()).toEqual(
      Object.values(generatedEnums.show_format_type).sort(),
    );
  });
});

describe("regular panel roles", () => {
  test("Regular Panellist is a valid cast role everywhere", async () => {
    const { cast_role_type: generated } =
      await import("../database/generated/enums");
    expect(Object.values(generated)).toContain("RegularPanellist");
    expect(
      SketchUpdateInputSchema.parse({
        cast: [{ person_id: 1, role: "RegularPanellist" }],
      }).cast?.[0].role,
    ).toBe("RegularPanellist");
  });

  test("the roles hidden by the filter are all real cast roles", async () => {
    const { REGULAR_CAST_ROLES } = await import("../shared/sketchGridBase");
    for (const role of REGULAR_CAST_ROLES) {
      expect(Object.values(cast_role_type)).toContain(role);
    }
    expect([...REGULAR_CAST_ROLES]).not.toContain("Host");
  });

  test("role names display with spaces", async () => {
    const { enumNameToDisplayName } = await import("../shared/utilities");
    expect(enumNameToDisplayName("RegularPanellist")).toBe("Regular Panellist");
    expect(enumNameToDisplayName("Captain")).toBe("Captain");
  });
});
