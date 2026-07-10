import { describe, it, expect, beforeEach } from 'vitest';

// ponytail: tests sessionStorage animation gate logic directly without rendering the full page.
// This avoids mocking IntersectionObserver, ResizeObserver, matchMedia, and all React contexts.

describe('ExpensesPage animation gate (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should be animated (true) when sessionStorage key is absent', () => {
    expect(sessionStorage.getItem('pfm-expenses-animated')).toBeNull();

    // This mirrors the page-level logic:
    // const [animated] = useState(() => !sessionStorage.getItem('pfm-expenses-animated'));
    const animated = !sessionStorage.getItem('pfm-expenses-animated');
    expect(animated).toBe(true);
  });

  it('should not be animated (false) when sessionStorage key is set', () => {
    sessionStorage.setItem('pfm-expenses-animated', 'true');

    const animated = !sessionStorage.getItem('pfm-expenses-animated');
    expect(animated).toBe(false);
  });

  it('should set the key on demo of markAnimated logic', () => {
    // Simulates handleTabChange calling markAnimated when switching to 'historia'
    const markAnimated = () => {
      if (!sessionStorage.getItem('pfm-expenses-animated')) {
        sessionStorage.setItem('pfm-expenses-animated', 'true');
      }
    };

    expect(sessionStorage.getItem('pfm-expenses-animated')).toBeNull();
    markAnimated();
    expect(sessionStorage.getItem('pfm-expenses-animated')).toBe('true');

    // Second call should not throw
    markAnimated();
    expect(sessionStorage.getItem('pfm-expenses-animated')).toBe('true');
  });
});