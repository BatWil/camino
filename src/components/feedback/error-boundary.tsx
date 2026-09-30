"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StateView } from "./state-view";

/** Local boundary for widgets, so one failing card never blanks the whole screen. */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <StateView
          kind="error"
          action={
            <Button variant="ink" size="sm" onClick={() => this.setState({ failed: false })}>
              Reintentar
            </Button>
          }
        />
      )
    );
  }
}
