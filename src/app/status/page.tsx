'use client'

import { createContext, useContext } from "react";
import Live2DViewer from './live2d-viewer'
import StatusCard from './status-card'
import Header from '@/components/status/Header'
import { useDashboard} from '@/hooks/status/useDashboard'
import { type SiteConfig, defaultConfig } from "@/lib/status-api";
import BlurredBubblesBackground from '@/layout/backgrounds/blurred-bubbles'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useThemeStore } from '@/hooks/use-theme'
import { getThemeAppearance } from '@/lib/theme'

export default function StatusPage() {
  const { current, timeline, selectedDate, changeDate, loading, error, viewerCount } = useDashboard();
  const ConfigContext = createContext<SiteConfig>(defaultConfig);
  const config = useContext(ConfigContext);
  const { displayName } = config;

  // 与全站共用主题状态；设备上下线不再改变页面配色。
  const mode = useThemeStore(state => state.mode);
  const { siteContent, regenerateKey } = useConfigStore();
  const appearance = getThemeAppearance(siteContent, mode);
  const isDark = mode === 'dark';

  return (
    <main className={`status-page${isDark ? ' status-night-mode' : ''}`}>
      {/* 背景气泡：复用主站 BlurredBubblesBackground，每次进入随机分布 */}
      <BlurredBubblesBackground
        absolute
        colors={appearance.backgroundColors}
        alpha={isDark ? 0.55 : 0.8}
        bottomBandStart={0.35}
        regenerateKey={regenerateKey}
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
