'use client'

import { createContext, useContext, useEffect, useMemo } from "react";
import Live2DViewer from './live2d-viewer'
import StatusCard from './status-card'
import Header from '@/components/status/Header'
import { useDashboard} from '@/hooks/status/useDashboard'
import { type SiteConfig, defaultConfig } from "@/lib/status-api";
import BlurredBubblesBackground from '@/layout/backgrounds/blurred-bubbles'
import siteContent from '@/config/site-content.json'

/** 夜模式气泡色板（与 status-night-mode 的 --status-* 保持一致） */
const NIGHT_BUBBLE_COLORS = ['#4A3FA0', '#6358C5', '#392B78', '#C447A8', "#E36CC4", "#191923"]

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

  // 全部设备离线 → 夜模式
  const allOffline = useMemo(() => {
    if (!current?.devices || current.devices.length === 0) return false;
    return current.devices.every((device) => device.is_online !== 1);
  }, [current?.devices]);

  return (
    <main className="status-page">
      {/* 背景气泡：复用主站 BlurredBubblesBackground，每次进入随机分布 */}
      <BlurredBubblesBackground
        absolute
        colors={allOffline ? NIGHT_BUBBLE_COLORS : siteContent.backgroundColors}
        alpha={allOffline ? 0.55 : 0.8}
        bottomBandStart={0.35}
        regenerateKey={allOffline ? 1 : 0}
      />

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