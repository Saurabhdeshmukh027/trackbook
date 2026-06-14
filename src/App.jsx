import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { Toaster } from 'react-hot-toast';
import './index.css';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fffaf5',
              color: '#362b24',
              border: '1px solid #e4d6c8',
              borderRadius: '16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 18px 40px rgba(61, 48, 40, 0.10)',
            },
            success: {
              iconTheme: { primary: '#2a8f79', secondary: '#fffaf5' },
            },
            error: {
              iconTheme: { primary: '#c94b4b', secondary: '#fffaf5' },
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
}
