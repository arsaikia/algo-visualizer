import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { delayForSpeed, useFramePlayer } from './useFramePlayer';

const add = (sum: number, frame: number) => sum + frame;

describe('useFramePlayer', () => {
  it('steps, finishes and resets', () => {
    const frames = [1, 2, 3];
    const { result } = renderHook(() => useFramePlayer(frames, 0, add, 10));
    expect(result.current.view).toBe(0);
    act(() => result.current.step());
    expect(result.current.view).toBe(1);
    expect(result.current.index).toBe(1);
    act(() => result.current.finish());
    expect(result.current.view).toBe(6);
    expect(result.current.isDone).toBe(true);
    act(() => result.current.reset());
    expect(result.current.view).toBe(0);
    expect(result.current.isDone).toBe(false);
  });

  it('resets when frames change', () => {
    let frames = [5, 5];
    const { result, rerender } = renderHook(() => useFramePlayer(frames, 0, add, 10));
    act(() => result.current.finish());
    expect(result.current.view).toBe(10);
    frames = [1];
    rerender();
    expect(result.current.view).toBe(0);
    expect(result.current.total).toBe(1);
  });

  it('reports playing state', () => {
    const frames = [1, 2, 3];
    const { result } = renderHook(() => useFramePlayer(frames, 0, add, 10));
    act(() => result.current.play());
    expect(result.current.isPlaying).toBe(true);
    act(() => result.current.pause());
    expect(result.current.isPlaying).toBe(false);
  });
});

describe('delayForSpeed', () => {
  it('is monotonically decreasing and at least 1ms', () => {
    const delays = Array.from({ length: 10 }, (_, i) => delayForSpeed(i + 1));
    expect(delays[0]).toBe(600);
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeLessThan(delays[i - 1]!);
    expect(Math.min(...delays)).toBeGreaterThanOrEqual(1);
  });
});
