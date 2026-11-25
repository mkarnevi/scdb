"use client";

import { useKeyboardShortcuts } from "@/app/hooks/useKeyboardShortcuts";
import {
  PLAYBACK_RATES,
  PlaybackRate,
  useVideoPlayer,
} from "@/app/hooks/useVideoPlayer";
import { segmentsInVideo, VideoPlayback } from "@/shared/localVideo";
import { getContentPath } from "@/shared/tableNames";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import MuiNextLink from "../MuiNextLink";
import SegmentProgressBar from "./SegmentProgressBar";

// Ported from football-videos-collection's VideoPlayer and PlayerControls,
// restyled with MUI. Plays a video file directly, starting at the segment.

/** Inactivity before controls hide in fullscreen */
const CONTROLS_HIDE_DELAY = 2500;

interface LocalVideoPlayerProps {
  src: string;
  playback?: VideoPlayback;
  width: number;
  height: number;
}

export default function LocalVideoPlayer({
  src,
  playback,
  width,
  height,
}: LocalVideoPlayerProps) {
  // Hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(
      () => setShowControls(false),
      CONTROLS_HIDE_DELAY,
    );
  }, [clearHideTimer]);

  const startSeconds = playback?.startSeconds ?? null;
  const endSeconds = playback?.endSeconds ?? null;

  const player = useVideoPlayer(startSeconds, endSeconds);
  const { videoRef, currentTime, duration, seek, togglePlay, toggleMute } =
    player;

  useKeyboardShortcuts(
    {
      onPlayPause: togglePlay,
      onSeekForward: () => seek(currentTime + 5),
      onSeekBackward: () => seek(currentTime - 5),
      onMute: toggleMute,
      onFullscreen: () => void handleFullscreen(),
    },
    true,
  );

  useEffect(() => {
    function handleFullscreenChange() {
      const nowFullscreen = document.fullscreenElement == containerRef.current;
      setIsFullscreen(nowFullscreen);
      setShowControls(true);
      if (nowFullscreen) scheduleHide();
      else clearHideTimer();
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      clearHideTimer();
    };
  }, [clearHideTimer, scheduleHide]);

  // Constants
  const segments = segmentsInVideo(src, playback?.segments);
  const currentIndex = segments.findIndex(
    (s) => s.id == playback?.currentSegmentId,
  );
  const nextSegment =
    currentIndex >= 0 ? segments[currentIndex + 1] : undefined;
  const label = playback?.segmentLabel ?? "Sketch";

  // Event Handlers
  async function handleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  }

  function handleMouseMove() {
    if (!isFullscreen) return;
    setShowControls(true);
    scheduleHide();
  }

  // Rendering
  const controls = (
    <Box sx={{ backgroundColor: isFullscreen ? "transparent" : "grey.900" }}>
      <SegmentProgressBar
        currentTime={currentTime}
        duration={duration}
        segments={segments}
        currentSegmentId={playback?.currentSegmentId}
        rangeStart={startSeconds}
        rangeEnd={endSeconds}
        onSeek={seek}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          pb: 0.5,
          color: "white",
        }}
      >
        <IconButton
          aria-label={player.isPlaying ? "Pause" : "Play"}
          color="inherit"
          onClick={togglePlay}
          size="small"
        >
          {player.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton
          aria-label={player.isMuted ? "Unmute" : "Mute"}
          color="inherit"
          onClick={toggleMute}
          size="small"
        >
          {player.isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Slider
          aria-label="Volume"
          max={1}
          min={0}
          onChange={(_e, value) => player.setVolume(value)}
          size="small"
          step={0.05}
          sx={{ width: 80, color: "white" }}
          value={player.isMuted ? 0 : player.volume}
        />
        <Box sx={{ flex: 1 }} />
        <Select
          aria-label="Playback speed"
          onChange={(e) =>
            player.setPlaybackRate(Number(e.target.value) as PlaybackRate)
          }
          size="small"
          sx={{ color: "white", fontSize: 13, height: 28 }}
          value={player.playbackRate}
          variant="standard"
          disableUnderline
        >
          {PLAYBACK_RATES.map((rate) => (
            <MenuItem key={rate} value={rate}>
              {rate}x
            </MenuItem>
          ))}
        </Select>
        <IconButton
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          color="inherit"
          onClick={() => void handleFullscreen()}
          size="small"
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box
      data-testid="local-video-player"
      onMouseMove={handleMouseMove}
      ref={containerRef}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "black",
        width: isFullscreen ? "100%" : width,
      }}
    >
      <video
        onClick={togglePlay}
        preload="metadata"
        ref={videoRef}
        src={src}
        style={{
          width: "100%",
          maxHeight: isFullscreen ? "100vh" : height,
          objectFit: "contain",
          background: "black",
        }}
      />

      {player.isBuffering && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <CircularProgress sx={{ color: "white" }} />
        </Box>
      )}

      {/* Shown once when the segment's end is reached */}
      {player.stoppedAtEnd && (
        <Box
          role="status"
          sx={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 1,
            backgroundColor: "#000c",
            color: "white",
            whiteSpace: "nowrap",
            maxWidth: "95%",
            "& .MuiButton-root": { whiteSpace: "nowrap", flexShrink: 0 },
          }}
        >
          <Typography variant="body2">End of {label.toLowerCase()}</Typography>
          <Button onClick={togglePlay} size="small" variant="outlined">
            Keep watching
          </Button>
          {nextSegment && (
            <Button
              component={MuiNextLink}
              href={getContentPath("sketch", nextSegment.url_slug)}
              size="small"
              variant="contained"
            >
              Next: {nextSegment.title}
            </Button>
          )}
        </Box>
      )}

      {isFullscreen ? (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, #000c, transparent)",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
            transition: "opacity 300ms",
          }}
        >
          {controls}
        </Box>
      ) : (
        controls
      )}
    </Box>
  );
}
