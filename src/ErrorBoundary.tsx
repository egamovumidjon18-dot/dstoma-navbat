import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  // @ts-ignore
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // @ts-ignore
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#020712', color: '#f87171', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Opps! Dasturda xatolik yuz berdi. (Uzur, tuzatyapmiz)</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', background: '#0f172a', padding: '10px', borderRadius: '8px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Xatolik matni (Buni dasturchiga yuboring):</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
