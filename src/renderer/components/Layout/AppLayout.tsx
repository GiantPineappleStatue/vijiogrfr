import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../features/settings/settingsSlice';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useSelector(selectTheme);
  const [currentTheme, setCurrentTheme] = useState<string>('system');

  // Apply theme
  useEffect(() => {
    // Get system theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    // Set theme based on settings or system preference
    const newTheme = theme === 'system' ? systemTheme : theme;
    setCurrentTheme(newTheme);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  return (
    <div className={`app-container theme-${currentTheme}`}>
      <div className="app-content">{children}</div>
    </div>
  );
};

export default AppLayout;
