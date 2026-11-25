"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Ported from football-videos-collection's useVideoPlayer, adapted for
// segments: it starts at the segment start and pauses once at its end.

export const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

export function clampVolume(vol: number): number {
  return Math.max(0, Math.min(1, vol));
}

/**
 * True when playback has just crossed the segment end. Used to pause once,
 * so pressing play again carries on past the end.
 */
export function crossedSegmentEnd(
  previousTime: number,
  currentTime: number,
  endTime: number | null | undefined,
): boolean {
  if (endTime == null) return false;
  return previousTime < endTime && currentTime >= endTime;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  playbackRate: PlaybackRate;
  isMuted: boolean;
  stoppedAtEnd: boolean;
}

export interface VideoPlayerControls {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  toggleMute: () => void;
}

export type UseVideoPlayerResult = VideoPlayerState & VideoPlayerControls;

export function useVideoPlayer(
  startTime?: number | null,
  endTime?: number | null,
): UseVideoPlayerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previousTimeRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime ?? 0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [stoppedAtEnd, setStoppedAtEnd] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Seek to the segment start once the browser knows the video's length
    const seekToStart = () => {
      if (startTime) video.currentTime = startTime;
      previousTimeRef.current = startTime ?? 0;
    };
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) seekToStart();

    const onPlay = () => {
      setIsPlaying(true);
      setStoppedAtEnd(false);
    };
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      const time = video.currentTime;
      if (
        !video.seeking &&
        crossedSegmentEnd(previousTimeRef.current, time, endTime)
      ) {
        video.pause();
        setStoppedAtEnd(true);
      }
      previousTimeRef.current = time;
      setCurrentTime(time);
    };
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      seekToStart();
    };
    const onSeeking = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onSeeked = () => {
      // A seek is a jump, not playback, so it never counts as crossing the end
      previousTimeRef.current = video.currentTime;
      setCurrentTime(video.currentTime);
      setIsBuffering(false);
    };
    const onVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [startTime, endTime]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    // Do NOT update React state here — state updates via 'seeked' event
    video.currentTime = Math.max(0, Math.min(time, video.duration || time));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const video = videoRef.current;
    const clamped = clampVolume(vol);
    if (video) {
      video.volume = clamped;
      if (clamped > 0 && video.muted) video.muted = false;
    }
    setVolumeState(clamped);
  }, []);

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // isMuted follows the element through the 'volumechange' event
    video.muted = !video.muted;
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    isBuffering,
    volume,
    playbackRate,
    isMuted,
    stoppedAtEnd,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    toggleMute,
  };
}
