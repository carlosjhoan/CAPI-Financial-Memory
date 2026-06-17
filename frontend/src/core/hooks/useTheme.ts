import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Theme } from '../types/common.types';

/**
 * Theme hook with support for 3 modes: light, dark, dim
 * - light: default light mode (white background)
 * - dark: dark mode (dark background + cold colors)
 * - dim: light mode variant with sepia/warm palette (cream background)
 * 
 * Note: The anti-FOUC script in index.html applies theme before React renders,
 * so we don't need a mounted flag — theme is applied on every change.
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

  // Calculate isDarkMode for backward compatibility
  const isDarkMode = theme !== 'light';

  // Apply theme to HTML element whenever it changes
  useEffect(() => {
    const html = document.documentElement;

    // Always set data-theme attribute
    html.setAttribute('data-theme', theme);

    // For backward compatibility with dark: classes
    // dim mode DOES NOT use dark: classes — it's a variant of light mode with sepia palette
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // dim class for dim-specific overrides if needed
    if (theme === 'dim') {
      html.classList.add('dim');
    } else {
      html.classList.remove('dim');
    }
  }, [theme]);

  // Cycle through themes: light -> dark -> dim -> light
  const cycleTheme = () => {
    const nextTheme: Theme = getNextTheme(theme);
    setTheme(nextTheme);
  };

  // Set a specific theme
  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme: setThemeMode,
    cycleTheme,
    isDarkMode,
  };
}

// Helper to get the next theme in the cycle
function getNextTheme(current: Theme): Theme {
  switch (current) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'dim';
    case 'dim':
      return 'light';
    default:
      return 'dark';
  }
}