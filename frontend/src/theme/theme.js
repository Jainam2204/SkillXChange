import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#e3f2fd',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    info: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#1e293b',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#1e293b',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      color: '#1e293b',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      color: '#1e293b',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#64748b',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#e3f2fd',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(25, 118, 210, 0.2)',
          },
        },
        contained: {
          backgroundColor: '#1976d2',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#1565c0',
            boxShadow: '0px 2px 8px rgba(25, 118, 210, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
});

export default theme;
