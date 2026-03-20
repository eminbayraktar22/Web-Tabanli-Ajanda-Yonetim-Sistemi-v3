import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React CATCH:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Sistem Hatası (Beyaz Ekran) Meydana Geldi</h1>
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Hata Mesajı:</p>
          <pre style={{ backgroundColor: '#fca5a5', padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap' }}>
             {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Bileşen Yığını (Component Stack):</p>
          <pre style={{ backgroundColor: '#fca5a5', padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
             {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
