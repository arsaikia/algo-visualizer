import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/renderApp';

describe('SortingPage', () => {
  it('disables configuration controls while playing and re-enables on pause', async () => {
    renderApp('/sorting');
    const algorithm = screen.getByLabelText('Algorithm');
    const randomize = screen.getByRole('button', { name: 'Randomize' });
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(algorithm).toBeDisabled();
    expect(randomize).toBeDisabled();
    expect(screen.getByLabelText(/array size/i)).toBeDisabled();
    expect(screen.getByLabelText(/speed/i)).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(algorithm).toBeEnabled();
    expect(randomize).toBeEnabled();
  });

  it('finishes with a sorted array and success status', async () => {
    renderApp('/sorting');
    await userEvent.selectOptions(screen.getByLabelText('Algorithm'), 'heap');
    expect(screen.getByRole('heading', { name: 'Heap Sort' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Skip to end' }));
    expect(screen.getByRole('status')).toHaveTextContent(/sorted!/i);
    const heights = screen.getAllByTestId('bar').map((bar) => parseFloat(bar.style.height));
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });

  it('resizes the array from the slider', () => {
    renderApp('/sorting');
    fireEvent.change(screen.getByLabelText(/array size/i), { target: { value: '12' } });
    expect(screen.getAllByTestId('bar')).toHaveLength(12);
  });
});

describe('SearchingPage', () => {
  it('explains that binary search needs a sorted array and displays it sorted', () => {
    renderApp('/searching');
    expect(screen.getByRole('note')).toHaveTextContent(/needs a sorted array/i);
    const values = screen
      .getAllByTestId('search-cell')
      .map((c) => Number(c.children[1]!.textContent));
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('reports found for a present target', async () => {
    renderApp('/searching');
    await userEvent.click(screen.getByRole('button', { name: 'Pick existing target' }));
    await userEvent.click(screen.getByRole('button', { name: 'Skip to end' }));
    expect(screen.getByRole('status')).toHaveTextContent(/found .* at index/i);
  });

  it('reports not found for a missing target with linear search', async () => {
    renderApp('/searching');
    await userEvent.selectOptions(screen.getByLabelText('Algorithm'), 'linear');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    const input = screen.getByLabelText('Target');
    await userEvent.clear(input);
    await userEvent.type(input, '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Skip to end' }));
    expect(screen.getByRole('status')).toHaveTextContent(/not in the array/i);
  });

  it('disables play for an invalid target', async () => {
    renderApp('/searching');
    await userEvent.clear(screen.getByLabelText('Target'));
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/enter a whole-number target/i);
  });
});

describe('PathfindingPage', () => {
  const cell = (row: number, col: number) =>
    document.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;

  it('draws walls by click and drag', () => {
    renderApp('/pathfinding');
    fireEvent.pointerDown(cell(0, 0), { clientX: 0, clientY: 0 });
    expect(cell(0, 0).dataset.kind).toBe('wall');
    fireEvent.pointerMove(cell(0, 1));
    fireEvent.pointerMove(cell(0, 2));
    fireEvent.pointerUp(window);
    expect(cell(0, 1).dataset.kind).toBe('wall');
    expect(cell(0, 2).dataset.kind).toBe('wall');
    fireEvent.click(screen.getByRole('button', { name: 'Clear walls' }));
    expect(cell(0, 0).dataset.kind).toBe('empty');
  });

  it('visualizes a path and handles an unreachable target', async () => {
    renderApp('/pathfinding');
    await userEvent.click(screen.getByRole('button', { name: 'Visualize' }));
    await act(async () => {
      screen.getByRole('button', { name: 'Pause' }).click();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Skip to end' }));
    expect(screen.getByRole('status')).toHaveTextContent(/path found/i);
    expect(document.querySelectorAll('[data-kind="path"]').length).toBeGreaterThan(0);

    const start = document.querySelector('[data-kind="start"]') as HTMLElement;
    const row = Number(start.dataset.row);
    const col = Number(start.dataset.col);
    for (const [r, c] of [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ] as const) {
      fireEvent.pointerDown(cell(r, c));
      fireEvent.pointerUp(window);
    }
    expect(screen.queryByRole('button', { name: 'Skip to end' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Visualize' }));
    await act(async () => {
      screen.getByRole('button', { name: 'Pause' }).click();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Skip to end' }));
    expect(screen.getByRole('status')).toHaveTextContent(/target is unreachable/i);
  });

  it('moves the start by dragging', () => {
    renderApp('/pathfinding');
    const start = document.querySelector('[data-kind="start"]') as HTMLElement;
    const row = Number(start.dataset.row);
    fireEvent.pointerDown(start);
    fireEvent.pointerMove(cell(0, 0));
    fireEvent.pointerUp(window);
    expect(cell(0, 0).dataset.kind).toBe('start');
    expect(document.querySelectorAll('[data-kind="start"]')).toHaveLength(1);
    expect(row).not.toBe(0);
  });
});
