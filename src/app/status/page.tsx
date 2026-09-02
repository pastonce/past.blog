'use client'

import { useEffect } from "react";
import Live2DViewer from './live2d-viewer'
import StatusCard from './status-card'
import Header from '@/components/status/Header'
import { useDashboard} from '@/hooks/status/useDashboard'
import { createContext, useContext } from "react";
import { type SiteConfig, defaultConfig } from "@/lib/status-api";

export default function StatusPage() {
  useEffect(() => {
    return () => {
      document.body.classList.remove("status-night-mode");
    };
  }, []);

  const { current, timeline, selectedDate, changeDate, loading, error, viewerCount } = useDashboard();
  const ConfigContext = createContext<SiteConfig>(defaultConfig);
  const config = useContext(ConfigContext);
  const { displayName } = config;

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

      <header className="status-page-header">
        <Header
          serverTime={current?.server_time}
          viewerCount={viewerCount}
          displayName={displayName}
        />
      </header>

      {/* Left: Status */}
      <div className="status-page-content">
        <section className="status-panel">
          <StatusCard
            current={current}
            timeline={timeline}
            selectedDate={selectedDate}
            changeDate={changeDate}
            loading={loading}
            error={error}
          />
        </section>
        {/* Right: Live2D */}
        <section className="live2d-panel">
          <Live2DViewer />
        </section>
      </div>
      
      <footer className="status-page-footer -mb-5 pt-2 separator-dashed text-center">
        <p className="text-[10px] text-(--status-text-muted)">
          {displayName} Now &middot; 每 10 秒自动刷新 &middot; (◕ᴗ◕)
        </p>
      </footer>

    </main>
  );
}