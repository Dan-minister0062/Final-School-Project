import React, { createContext, useState, useEffect } from 'react';

// ✅ Export ThemeContext as a named export
export const ThemeContext = createContext();

// ✅ Export ThemeProvider as a named export
export const ThemeProvider = ({ children }) => {
  // Theme preference is intentionally NOT persisted across reloads
  // (no browser persistence). Defaults to light.
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Apply theme to document
    if (darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-bs-theme');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};