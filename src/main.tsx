import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver and Script errors
window.addEventListener('error', e => {
  if (e.message && (e.message === 'Script error.' || e.message.includes('ResizeObserver'))) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

// Suppress WebSocket closed without opened unhandled rejections
window.addEventListener('unhandledrejection', e => {
  if (e.reason && e.reason.message && e.reason.message.includes('WebSocket')) {
    e.preventDefault();
  } else if (e.reason === 'WebSocket closed without opened.') {
    e.preventDefault();
  }
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null, info: ErrorInfo | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#222', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            {this.state.error?.toString()}
            <br />
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
