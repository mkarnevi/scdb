"use client";

import { useEffect, useRef } from "react";

// Ported from football-videos-collection's useKeyboardShortcuts

export interface KeyboardHandlers {
  onPlayPause: () => void;
  onSeekForward: () => void; // +5 seconds
  onSeekBackward: () => void; // -5 seconds
  onMute: () => void;
  onFullscreen: () => void;
}

/** Keys that a focused control already handles itself */
function isOwnedByFocusedControl(e: KeyboardEvent): boolean {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  // A focused button already toggles on Space, so don't toggle twice
  return e.code == "Space" && target.closest("button, [role=button]") != null;
}

export function useKeyboardShortcuts(
  handlers: KeyboardHandlers,
  enabled: boolean,
): void {
  // Keep the latest handlers without re-binding the listener every render
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isOwnedByFocusedControl(e)) return;

      const current = handlersRef.current;
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          current.onPlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          current.onSeekForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          current.onSeekBackward();
          break;
        case "KeyM":
          e.preventDefault();
          current.onMute();
          break;
        case "KeyF":
          e.preventDefault();
          current.onFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
