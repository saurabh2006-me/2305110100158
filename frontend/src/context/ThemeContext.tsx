/**
 * Theme Provider Context
 * @module context/ThemeContext
 */

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { useNotificationStore } from '../store/notificationStore';

const ThemeContext = createContext<{ toggleTheme: () => void }>({ toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useNotificationStore();

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
      background: {
        default: theme === 'dark' ? '#121212' : '#f5f5f5',
        paper: theme === 'dark' ? '#1e1e1e' : '#ffffff'
      }
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: theme === 'dark' ? '#1e1e1e' : '#f1f1f1' },
            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' }
          }
        }
      }
    }
  }), [theme]);

  return (
    <ThemeContext.Provider value={{ toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
