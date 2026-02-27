import React, { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="border-destructive max-w-lg w-full">
            <CardContent className="py-8">
              <h2 className="text-lg font-bold text-destructive">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground mt-2 break-all">
                {this.state.error?.message}
              </p>
              <details className="mt-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">
                  Error details
                </summary>
                <pre className="mt-2 bg-muted p-2 rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-3 py-1 rounded bg-primary text-primary-foreground text-sm"
              >
                Reload page
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
