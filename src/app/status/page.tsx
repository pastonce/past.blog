'use client'

import { useEffect } from "react";
import Live2DViewer from './live2d-viewer'
import StatusCard from './status-card'

export default function StatusPage() {
  useEffect(() => {
    return () => {
      document.body.classList.remove("status-night-mode");
    };
  }, []);

  return (
    <main className="status-page">
      {/* Sakura petal layer */}
      <div className="sakura-container" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className={`sakura-petal sakura-petal-${i}`}
          />
        ))}
      </div>

      {/* Left: Status */}
      <section className="status-panel">
        <StatusCard />
      </section>

      {/* Right: Live2D */}
      <section className="live2d-panel">
        <Live2DViewer />
      </section>
    </main>
  );
}