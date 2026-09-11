import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  silent?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown error',
      error: error || null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const name = this.props.componentName ? `[${this.props.componentName}] ` : '';
    console.error(`Uncaught error caught by ${name}ErrorBoundary:`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', error: null });
    window.location.hash = '#/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error || new Error(this.state.errorMessage), this.handleReset);
        }
        return this.props.fallback;
      }

      if (this.props.silent) {
        return null;
      }

      return (
        <div className="min-h-screen bg-page text-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-subtle rounded-2xl p-6 md:p-8 text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-[24px] leading-[34px] font-bold text-primary">
                কিছু সমস্যা হয়েছে / Something went wrong
              </h2>
              <p className="text-[16px] leading-[26px] text-secondary">
                অ্যাপ্লিকেশনটি সাময়িকভাবে কোনো ত্রুটির সম্মুখীন হয়েছে। নিচের বোতামে ক্লিক করে পুনরায় মূল পাতায় ফিরে যান।
              </p>
              <p className="text-[14px] leading-[22px] text-muted font-mono">
                {this.state.errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary-action inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>মূল পাতায় ফিরে যান / Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
