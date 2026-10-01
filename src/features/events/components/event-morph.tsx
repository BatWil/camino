import { ViewTransition, type ReactNode } from "react";

/**
 * The event card and the event's detail hero share a name, so on navigation the browser morphs
 * one into the other (View Transitions API through React). Unsupported browsers just navigate.
 */
export function EventMorph({ id, children }: { id: string; children: ReactNode }) {
  return (
    <ViewTransition name={`event-${id}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
