import React, { createContext, useState, useEffect } from 'react';

// ✅ Export ThemeContext as a named export
export const ThemeContext = createContext();

// ✅ Export ThemeProvider as a named export
export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  const [darkMode, setDarkMode] = useState(savedTheme === 'dark');

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    
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