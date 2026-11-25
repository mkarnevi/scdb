"use client";

import VideoPlayer from "@/app/components/VideoPlayer";
import staticUrl from "@/shared/cdnHost";
import { VideoPlayback, videoSourceLabel } from "@/shared/localVideo";
import { formatTimecode } from "@/shared/timecode";
import PlayCircleFilledTwoToneIcon from "@mui/icons-material/PlayCircleFilledTwoTone";
import {
  Button,
  ButtonBase,
  ButtonGroup,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";

interface VideoHeroProps {
  title: string;
  image_cdn_key?: string;
  videoUrls?: string[];
  playback?: VideoPlayback;
}

export default function VideoHero({
  title,
  image_cdn_key,
  videoUrls,
  playback,
}: VideoHeroProps) {
  // Hooks
  const [playVideoUrls, setPlayVideoUrls] = useState<string[] | undefined>();

  // Rendering
  const imgWidth = 350;
  const imgHeight = Math.floor(imgWidth * (9 / 16));

  if (!image_cdn_key && !videoUrls?.length) {
    return (
      <Image
        alt={title}
        src={"/images/sketch-placeholder.png"}
        style={{ objectFit: "cover", borderRadius: 8 }}
        priority
        width={imgWidth}
        height={imgHeight}
      />
    );
  }

  return (
    <>
      <Stack>
        <ButtonBase
          aria-controls="video-player-overlay"
          aria-haspopup="true"
          aria-label="Play Video"
          onClick={() => setPlayVideoUrls(videoUrls)}
          style={{
            overflow: "hidden",
            width: imgWidth,
            height: imgHeight,
            position: "relative",
          }}
        >
          {!!videoUrls && (
            <PlayCircleFilledTwoToneIcon
              style={{
                color: "white",
                position: "absolute",
                right: "2px",
                bottom: "2px",
              }}
              fontSize="large"
            />
          )}
          <Image
            alt={title}
            src={
              image_cdn_key
                ? `${staticUrl}/${image_cdn_key}`
                : "/images/sketch-placeholder.png"
            }
            style={{ objectFit: "cover", borderRadius: 8 }}
            priority
            width={imgWidth}
            height={imgHeight}
          />
        </ButtonBase>

        {videoUrls?.length ? (
          <>
            {playback?.startSeconds != null && (
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginTop: 8 }}
              >
                Starts at {formatTimecode(playback.startSeconds)}
                {playback.endSeconds != null &&
                  `, ends at ${formatTimecode(playback.endSeconds)}`}
              </Typography>
            )}
            <ButtonGroup style={{ marginTop: "16px" }} size="small">
              <Button
                aria-controls="video-player-overlay"
                aria-haspopup="true"
                aria-label="Play Video"
                onClick={() => setPlayVideoUrls(videoUrls)}
                variant="contained"
              >
                Watch Now
              </Button>
              {videoUrls?.map((url, index) => (
                <Button
                  key={index}
                  LinkComponent="a"
                  aria-controls="video-player-overlay"
                  aria-haspopup="true"
                  aria-label="Play Video"
                  target="_blank"
                  href={url}
                >
                  {videoSourceLabel(url)}
                </Button>
              ))}
            </ButtonGroup>
          </>
        ) : (
          <Button
            disabled
            variant="contained"
            style={{ marginTop: "16px" }}
            size="small"
          >
            Video lost: Help us find a site to watch it on 😭
          </Button>
        )}
      </Stack>
      {!!playVideoUrls && (
        <VideoPlayer
          videoUrls={playVideoUrls}
          onClose={() => setPlayVideoUrls(undefined)}
          playback={playback}
        />
      )}
    </>
  );
}
