import { useCallback, useEffect, useRef, useState } from 'react';

interface Cursor<S> {
  index: number;
  view: S;
}

export interface FramePlayer<S> {
  view: S;
  index: number;
  total: number;
  isPlaying: boolean;
  isDone: boolean;
  play: () => void;
  pause: () => void;
  step: () => void;
  finish: () => void;
  reset: () => void;
}

const MAX_FRAMES_PER_TICK = 500;

/**
 * Replays a precomputed list of frames into a view state using requestAnimationFrame.
 * `delayMs` is the time per frame; fast speeds apply several frames per animation tick.
 * A new `frames` array identity resets playback (and starts it when `autoPlay` is set).
 */
export function useFramePlayer<S, F>(
  frames: readonly F[],
  initialView: S,
  apply: (view: S, frame: F) => S,
  delayMs: number,
  options: { autoPlay?: boolean } = {},
): FramePlayer<S> {
  const autoPlay = options.autoPlay ?? false;
  const [cursor, setCursor] = useState<Cursor<S>>({ index: 0, view: initialView });
  const [playing, setPlaying] = useState(autoPlay && frames.length > 0);
  const [source, setSource] = useState({ frames, initialView });

  if (source.frames !== frames || source.initialView !== initialView) {
    setSource({ frames, initialView });
    setCursor({ index: 0, view: initialView });
    setPlaying(autoPlay && frames.length > 0);
  }

  const framesRef = useRef(frames);
  const applyRef = useRef(apply);
  const delayRef = useRef(delayMs);
  useEffect(() => {
    framesRef.current = frames;
    applyRef.current = apply;
    delayRef.current = delayMs;
  });

  const advance = useCallback((count: number) => {
    setCursor((current) => {
      const all = framesRef.current;
      const end = Math.min(all.length, current.index + count);
      if (end === current.index) return current;
      let view = current.view;
      for (let i = current.index; i < end; i++) view = applyRef.current(view, all[i] as F);
      return { index: end, view };
    });
  }, []);

  const isDone = cursor.index >= frames.length;

  useEffect(() => {
    if (playing && isDone) setPlaying(false);
  }, [playing, isDone]);

  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    let last: number | null = null;
    let accumulated = 0;
    const tick = (now: number) => {
      if (last === null) {
        // Apply the first frame immediately so Play feels responsive.
        advance(1);
      } else {
        accumulated += now - last;
        const count = Math.floor(accumulated / Math.max(1, delayRef.current));
        if (count > 0) {
          accumulated -= count * delayRef.current;
          advance(Math.min(count, MAX_FRAMES_PER_TICK));
        }
      }
      last = now;
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing, advance]);

  return {
    view: cursor.view,
    index: cursor.index,
    total: frames.length,
    isPlaying: playing && !isDone,
    isDone,
    play: useCallback(() => setPlaying(true), []),
    pause: useCallback(() => setPlaying(false), []),
    step: useCallback(() => advance(1), [advance]),
    finish: useCallback(() => {
      setPlaying(false);
      advance(Number.MAX_SAFE_INTEGER);
    }, [advance]),
    reset: useCallback(() => {
      setPlaying(false);
      setCursor({ index: 0, view: source.initialView });
    }, [source.initialView]),
  };
}

/** Maps a 1–10 speed slider to a per-frame delay (600ms … ~1ms). */
export function delayForSpeed(speed: number): number {
  return Math.max(1, Math.round(600 / 2 ** (speed - 1)));
}
