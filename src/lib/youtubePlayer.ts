// Thin loader for the YouTube IFrame Player API — used by CourseViewer.tsx
// so it can read the real current playback position (player.getCurrentTime())
// for "add a note at this timestamp" and jump back to a note's timestamp
// (player.seekTo()). Lesson completion itself stays a manual "Mark as
// complete" button (matching the reference app's own behavior), so this
// loader deliberately doesn't wire up onStateChange/auto-progress tracking.
const SCRIPT_ID = "youtube-iframe-api";

export interface YoutubePlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YoutubePlayer }) => void;
          };
        }
      ) => YoutubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return loadPromise;
}
