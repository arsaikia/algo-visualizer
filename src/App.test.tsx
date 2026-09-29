import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from './hooks/useTheme';
import { renderApp } from './test/renderApp';

describe('routing and layout', () => {
  it('renders the landing page with category cards', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/see algorithms/i);
    const main = screen.getByRole('main');
    for (const name of ['Sorting', 'Searching', 'Pathfinding']) {
      expect(within(main).getByRole('heading', { name })).toBeInTheDocument();
    }
  });

  it.each([
    ['/sorting', 'Sorting'],
    ['/searching', 'Searching'],
    ['/pathfinding', 'Pathfinding'],
  ])('renders %s', (route, title) => {
    renderApp(route);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('navigates via the nav bar', async () => {
    renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await userEvent.click(within(nav).getAllByRole('link', { name: 'Pathfinding' })[0]!);
    expect(screen.getByRole('heading', { level: 1, name: 'Pathfinding' })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown routes', () => {
    renderApp('/nope');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

describe('theme toggle', () => {
  it('toggles dark mode and persists the choice', async () => {
    renderApp('/');
    expect(document.documentElement).not.toHaveClass('dark');
    await userEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('restores the stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderApp('/');
    expect(document.documentElement).toHaveClass('dark');
    expect(
      screen.getAllByRole('button', { name: /switch to light theme/i }).length,
    ).toBeGreaterThan(0);
  });
});
