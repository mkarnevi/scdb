"use client";

import { VideoSegment } from "@/shared/localVideo";
import { formatTimecode } from "@/shared/timecode";
import { Box, Tooltip, Typography } from "@mui/material";

// Ported from football-videos-collection's ProgressBar: markers sit at each
// segment's start; the current segment's range is shaded.

interface SegmentProgressBarProps {
  currentTime: number;
  duration: number;
  segments: (VideoSegment & { start_seconds: number })[];
  currentSegmentId?: number;
  rangeStart?: number | null;
  rangeEnd?: number | null;
  onSeek: (time: number) => void;
}

function percentOf(time: number, duration: number) {
  if (!duration) return 0;
  return Math.max(0, Math.min(100, (time / duration) * 100));
}

export default function SegmentProgressBar({
  currentTime,
  duration,
  segments,
  currentSegmentId,
  rangeStart,
  rangeEnd,
  onSeek,
}: SegmentProgressBarProps) {
  // Constants
  const progressPercent = percentOf(currentTime, duration);
  const hasRange = rangeStart != null || rangeEnd != null;
  const rangeLeft = percentOf(rangeStart ?? 0, duration);
  const rangeRight = percentOf(rangeEnd ?? duration, duration);

  // Event Handlers
  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    onSeek(fraction * duration);
  }

  function handleBarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Arrow keys are handled by the player's shortcuts; Home/End jump
    if (e.key == "Home") onSeek(rangeStart ?? 0);
    if (e.key == "End") onSeek(rangeEnd ?? duration);
  }

  // Rendering
  return (
    <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
      <Box
        aria-label="Seek"
        aria-valuemax={Math.round(duration)}
        aria-valuemin={0}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={formatTimecode(currentTime)}
        onClick={handleBarClick}
        onKeyDown={handleBarKeyDown}
        role="slider"
        tabIndex={0}
        sx={{
          position: "relative",
          height: 8,
          borderRadius: 1,
          backgroundColor: "grey.800",
          cursor: "pointer",
          transition: "height 150ms",
          "&:hover": { height: 12 },
        }}
      >
        {/* Filled progress */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${progressPercent}%`,
            backgroundColor: "primary.main",
            borderRadius: 1,
            opacity: 0.9,
          }}
        />

        {/* Current segment's range within the file */}
        {hasRange && duration > 0 && (
          <Box
            data-testid="segment-range"
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${rangeLeft}%`,
              width: `${Math.max(0, rangeRight - rangeLeft)}%`,
              backgroundColor: "warning.main",
              opacity: 0.45,
              zIndex: 1,
              pointerEvents: "none",
              borderRadius: 1,
            }}
          />
        )}

        {/* Segment markers */}
        {duration > 0 &&
          segments.map((segment) => {
            const isCurrent = segment.id == currentSegmentId;
            return (
              <Tooltip
                key={segment.id}
                arrow
                placement="top"
                title={
                  <>
                    <Typography
                      variant="caption"
                      component="div"
                      fontWeight="bold"
                    >
                      {segment.title}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {formatTimecode(segment.start_seconds)}
                      {segment.end_seconds != null &&
                        ` – ${formatTimecode(segment.end_seconds)}`}
                    </Typography>
                  </>
                }
              >
                <Box
                  aria-label={`Jump to ${segment.title}`}
                  component="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(segment.start_seconds);
                  }}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: `${percentOf(segment.start_seconds, duration)}%`,
                    transform: "translate(-50%, -50%)",
                    width: isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    p: 0,
                    border: "2px solid black",
                    borderRadius: "50%",
                    backgroundColor: isCurrent ? "warning.main" : "grey.300",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                />
              </Tooltip>
            );
          })}
      </Box>

      {/* Time display */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.5,
          color: "grey.400",
          fontSize: 12,
        }}
      >
        <span>{formatTimecode(currentTime)}</span>
        <span>{formatTimecode(duration)}</span>
      </Box>
    </Box>
  );
}
