"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Backdrop, Box, Chip, Typography } from "@mui/material";
import {
  isLocalVideoUrl,
  VideoPlayback,
  videoSourceLabel,
} from "@/shared/localVideo";
import { useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import MuiNextLink from "./MuiNextLink";
import LocalVideoPlayer from "./video/LocalVideoPlayer";

interface VideoPlayerProps {
  videoUrls: string[];
  onClose: () => void;
  /** Segment start/end and the episode's other segments, when known */
  playback?: VideoPlayback;
}

/** Adds YouTube's start/end parameters so embeds play just the segment */
export function withYouTubeSegment(
  embedUrl: string,
  playback?: VideoPlayback,
): string {
  const start = playback?.startSeconds;
  const end = playback?.endSeconds;
  if (start == null && end == null) return embedUrl;

  const url = new URL(embedUrl);
  if (start != null) url.searchParams.set("start", String(start));
  if (end != null) url.searchParams.set("end", String(end));
  return url.toString();
}

export function deriveVideoInfo(url: string): {
  videoUrl: string;
  provider: string;
} {
  if (isLocalVideoUrl(url)) {
    return { videoUrl: url, provider: "local" };
  }
  if (url.startsWith("https://www.youtube.com/embed/")) {
    return { videoUrl: url, provider: "youtube" };
  }
  if (url.startsWith("https://player.vimeo.com/video/")) {
    return { videoUrl: url, provider: "vimeo" };
  }
  if (url.startsWith("https://archive.org/embed/")) {
    return { videoUrl: url, provider: "archive" };
  }
  if (url.startsWith("https://www.youtube.com/watch?v=")) {
    const videoId = url.split("v=").pop();
    return {
      videoUrl: `https://www.youtube.com/embed/${videoId}`,
      provider: "youtube",
    };
  }
  if (url.startsWith("https://vimeo.com/")) {
    const videoId = url.split("/").pop();
    return {
      videoUrl: `https://player.vimeo.com/video/${videoId}`,
      provider: "vimeo",
    };
  }
  if (url.startsWith("https://archive.org/details/")) {
    const videoId = url.split("/")[4];
    return {
      videoUrl: `https://archive.org/embed/${videoId}`,
      provider: "archive",
    };
  }
  if (url.startsWith("https://www.tiktok.com/@")) {
    const videoId = url.match(/\/video\/(\d+)/)?.[1] || "";
    return { videoUrl: videoId, provider: "tiktok" };
  }
  if (url.startsWith("https://www.reddit.com/")) {
    return { videoUrl: url, provider: "reddit" };
  }
  if (url.startsWith("https://www.facebook.com/")) {
    return { videoUrl: url, provider: "facebook" };
  }
  return { videoUrl: url, provider: "" };
}

export default function VideoPlayer({
  videoUrls,
  onClose,
  playback,
}: VideoPlayerProps) {
  // Hooks
  const [selectedUrl, setSelectedUrl] = useState(videoUrls[0]);
  const { videoUrl, provider } = useMemo(
    () => deriveVideoInfo(selectedUrl),
    [selectedUrl],
  );
  let { height, width } = useWindowSize();

  // Rendering
  if (typeof window !== "undefined") {
    width = Math.round(Math.min(window.innerWidth * 0.95, 800));
    height = Math.round(Math.min(window.innerHeight * 0.75, 600));
  }

  return (
    <Backdrop
      aria-hidden={false}
      onClick={onClose}
      open={true}
      sx={{
        backgroundColor: "#000d",
        color: "white",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box
        aria-label="Video Player Overlay"
        id="video-player-overlay"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        style={{
          background: "black",
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box style={{ flex: 1, margin: "auto" }}>
          {provider == "local" && (
            <LocalVideoPlayer
              key={videoUrl}
              src={videoUrl}
              playback={playback}
              width={width}
              height={height}
            />
          )}

          {provider == "reddit" && (
            <div>
              {/* The div above prevents an error with unmounting this block */}
              <blockquote
                className="reddit-embed-bq"
                style={{ height, background: "black" }}
                data-embed-theme="dark"
                data-embed-showedits="false"
                data-embed-height={height}
              >
                <a href={videoUrl}>Link to video on Reddit</a>
              </blockquote>
              <script async src="https://embed.reddit.com/widgets.js"></script>
            </div>
          )}

          {provider == "facebook" && (
            <iframe
              src={`https://www.facebook.com/plugins/video.php?height=${height}&href=${videoUrl}&show_text=false&width=${width}&t=0`}
              width={width}
              height={height}
              style={{ border: "none", overflow: "hidden" }}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen={true}
            ></iframe>
          )}

          {provider == "tiktok" && (
            <div>
              {/* The div above prevents an error with unmounting this block */}
              <blockquote
                className="tiktok-embed"
                data-video-id={videoUrl}
                style={{
                  maxWidth: width,
                  minWidth: height,
                  background: "black",
                }}
              >
                <section style={{ background: "black" }}></section>
              </blockquote>
              <script async src="https://www.tiktok.com/embed.js"></script>
            </div>
          )}

          {(provider == "youtube" ||
            provider == "vimeo" ||
            provider == "archive") && (
            <iframe
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              src={
                provider == "youtube"
                  ? withYouTubeSegment(videoUrl, playback)
                  : videoUrl
              }
              style={{ border: "1px solid #222", background: "black" }}
              width={width}
              height={height}
            ></iframe>
          )}

          {provider == "vimeo" && (
            <script src="https://player.vimeo.com/api/player.js" async></script>
          )}

          {!provider && (
            <Box
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                marginTop: 2,
              }}
            >
              <Typography variant="h6">
                Video provider not found for url
              </Typography>
              <Typography variant="body1">
                Click this link to go there directly
              </Typography>
              <Box style={{ marginTop: "16px" }}>
                <MuiNextLink href={videoUrl} target="_blank">
                  {videoUrl}
                </MuiNextLink>
              </Box>
            </Box>
          )}
        </Box>

        {/* Bottom bar with video links */}
        {videoUrls.length > 1 && (
          <Box style={{ display: "flex" }}>
            <Box style={{ display: "flex", flexWrap: "wrap", flex: 1 }}>
              {videoUrls.map((url, index) => (
                <Chip
                  clickable={url == selectedUrl ? false : true}
                  key={index}
                  label={videoSourceLabel(url)}
                  onClick={() => setSelectedUrl(url)}
                  style={{ margin: "5px" }}
                  variant={url == selectedUrl ? "filled" : "outlined"}
                />
              ))}
            </Box>
            <Chip
              clickable
              icon={<CloseIcon />}
              label="Close"
              onClick={onClose}
              style={{ margin: "5px" }}
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    </Backdrop>
  );
}
