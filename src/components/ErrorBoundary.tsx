import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('XENA render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7FF] text-[#171717] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl shadow-sm p-8 max-w-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center text-white text-xl font-extrabold mx-auto mb-4">X</div>
            <h2 className="font-bold text-lg mb-1">Something went wrong</h2>
            <p className="text-sm text-[#6B7280] mb-4">The app hit an unexpected error. Reload to continue — your session is safe.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-sm cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}