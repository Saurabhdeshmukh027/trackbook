import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SuspendedBanner() {
  return (
    <div className="suspended-banner">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>Account suspended. The workspace is in read-only mode until your TrackBook plan is restored.</span>
    </div>
  );
}
