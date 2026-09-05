"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SiteConfig, DeviceState } from "@/lib/status-api";
import { defaultConfig, fetchHealthData } from "@/lib/status-api";
import CurrentStatus from "@/components/status/CurrentStatus";
import DeviceCard from "@/components/status/DeviceCard";
import DatePicker from "@/components/status/DatePicker";
import Timeline from "@/components/status/Timeline";
import HealthData from "@/components/status/HealthData";
import { type CurrentResponse, type TimelineResponse } from "@/lib/status-api";

interface StatusCardProps {
  current: CurrentResponse | null;
  timeline: TimelineResponse | null;
  selectedDate: string;
  changeDate: (date: string) => void;
  loading: boolean;
  error: string | null;
}

export default function StatusCard({
  current,
  timeline,
  selectedDate,
  changeDate,
  loading,
  error,
}: StatusCardProps) {
  const ConfigContext = createContext<SiteConfig>(defaultConfig);
  const config = useContext(ConfigContext);
  const { displayName } = config;
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [tab, setTab] = useState<"activity" | "health">("activity");
  const [hasHealthData, setHasHealthData] = useState(false);

  useEffect(() => {
    if (!hasHealthData && tab === "health") setTab("activity");
  }, [hasHealthData, tab]);

  // 所有设备按 device_id 排序
  const devices = useMemo(() => {
    const list = current?.devices ?? [];
    return [...list].sort((left, right) => left.device_id.localeCompare(right.device_id));
  }, [current?.devices]);
  // 当前选中的设备
  const selectedDevice = useMemo(() => {
    if (devices.length === 0) return undefined;
    if (selectedDeviceId) {
      const found = devices.find((device) => device.device_id === selectedDeviceId);
      if (found) return found;
    }
    return devices.find((device) => device.is_online === 1) || devices[0];
  }, [devices, selectedDeviceId]);

  const selectedDeviceIdResolved = selectedDevice?.device_id;
  // 当前设备正在使用的 App
  const currentAppByDevice = useMemo(() => {
    const map: Record<string, string> = {};
    if (current?.devices) {
      for (const device of current.devices) {
        if (device.is_online === 1 && device.app_name) {
          map[device.device_id] = device.app_name;
        }
      }
    }
    return map;
  }, [current?.devices]);
  // 所有设备是否都离线
  const allOffline = useMemo(() => {
    if (!current?.devices || current.devices.length === 0) return false;
    return current.devices.every((device) => device.is_online !== 1);
  }, [current?.devices]);
  // 根据当前选中的设备获取健康数据
  useEffect(() => {
    if (!selectedDate || !selectedDeviceIdResolved) {
      setHasHealthData(false);
      return;
    }

    const controller = new AbortController();
    setHasHealthData(false);

    fetchHealthData(
      selectedDate,
      controller.signal,
      selectedDeviceIdResolved,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setHasHealthData(result.records.length > 0);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setHasHealthData(false);
        }
      });

    return () => controller.abort();
  }, [selectedDate, selectedDeviceIdResolved]);
  // Timeline 只显示当前选中设备信息
  const filteredTimeline = useMemo(() => {
    if (!timeline || !selectedDevice) return timeline;
    const deviceId = selectedDevice.device_id;
    const segments = timeline.segments ?? [];
    const summary = timeline.summary ?? {};
    return {
      ...timeline,
      segments: segments.filter((segment) => segment.device_id === deviceId),
      summary: deviceId in summary ? { [deviceId]: summary[deviceId] } : {},
    };
  }, [timeline, selectedDevice]);

  // 所有设备离线时给 body 添加 status-night-mode class
  useEffect(() => {
    const statusPage = document.querySelector(".status-page");

    if (!statusPage) return;

    statusPage.classList.toggle(
      "status-night-mode",
      allOffline,
    );

    return () => {
      statusPage.classList.remove("status-night-mode");
    };
  }, [allOffline]);

  // 只有本地一个面板时，Panels 切换器和总览大卡片的信息与下方状态气泡/
  // 设备列表完全重复，纯占竖向空间——整个区域不渲染
  // const isSinglePanel = resolvedSnapshots.length <= 1;

  return (
    <div className="status-card">
      {/* 迁移到 /status 页面下 */}
      {/* <Header
        serverTime={current?.server_time}
        viewerCount={viewerCount}
        displayName={displayName}
      /> */}

      {/* {!isSinglePanel && (
        <DashboardSwitcher
          dashboards={resolvedSnapshots}
          selectedDashboardId={activeDashboard?.id ?? "local"}
          onSelect={setSelectedDashboardId}
          overviewExpanded={overviewExpanded}
          onToggleOverview={() => setOverviewExpanded((v) => !v)}
        />
      )} */}

      {error && (
        <div className="vn-bubble mb-4 border-(--status-primary)">
          <p className="text-sm text-(--status-text)">
            (&gt;_&lt;) {displayName} 的面板连接失败了喵...
          </p>
          <p className="text-xs text-(--status-text-muted) mt-1">
            别担心，会自动重试的~
          </p>
        </div>
      )}

      {loading && !current && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-2xl">(=^-ω-^=)</p>
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
          <p className="text-xs text-(--status-text-muted)">正在加载喵~</p>
        </div>
      )}

      {current && (
        <>
          <CurrentStatus device={selectedDevice} displayName={displayName} />

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:flex-1 lg:min-h-0">
            {/* 单设备时不渲染设备栏——状态气泡已经展示了这台设备的一切，
                竖屏访问时省出的空间让时间线不用滚动就能看到 */}
            {devices.length !== 1 && (
              <div className="lg:w-56 shrink-0">
                <h2 className="text-xs font-bold text-(--status-primary) uppercase tracking-wider mb-2">
                  Devices
                </h2>
                {devices.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-lg mb-1">( -ω-) zzZ</p>
                    <p className="text-xs text-(--status-text-muted) italic">
                      还没有设备连接呢~
                    </p>
                  </div>
                ) : (
                  /* 手机上横向滑动一行，lg 起恢复纵向侧栏 */
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                    {devices.map((device) => (
                      <DeviceCard
                        key={device.device_id}
                        device={device}
                        selected={selectedDevice?.device_id === device.device_id}
                        onSelect={() => setSelectedDeviceId(device.device_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0 lg:min-h-0 lg:flex lg:flex-col">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <DatePicker selectedDate={selectedDate} onChange={changeDate} />
                {hasHealthData && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTab("activity")}
                      className={`pill-btn text-xs px-3 py-1 ${
                        tab === "activity"
                          ? "bg-(--status-primary) text-white border-(--status-primary)"
                          : ""
                      }`}
                    >
                      活动
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("health")}
                      className={`pill-btn text-xs px-3 py-1 ${
                        tab === "health"
                          ? "bg-(--status-primary) text-white border-(--status-primary)"
                          : ""
                      }`}
                    >
                      健康
                    </button>
                  </div>
                )}
              </div>

              <div className="separator-dashed mb-3" />

              {tab === "activity" ? (
                <>
                  {loading && filteredTimeline ? (
                    <div className="opacity-60">
                      <Timeline
                        segments={filteredTimeline.segments}
                        summary={filteredTimeline.summary}
                        currentAppByDevice={currentAppByDevice}
                      />
                    </div>
                  ) : filteredTimeline ? (
                    <Timeline
                      segments={filteredTimeline.segments}
                      summary={filteredTimeline.summary}
                      currentAppByDevice={currentAppByDevice}
                    />
                  ) : null}
                </>
              ) : (
                <HealthData
                  selectedDate={selectedDate}
                  deviceId={selectedDevice?.device_id}
                />
              )}
            </div>
          </div>
        </>
      )}
      {/* 迁移到 /status 页面下 */}
      {/* <footer className="mt-12 pt-4 separator-dashed text-center">
        <p className="text-[10px] text-(--status-text-muted)">
          {displayName} Now &middot; 每 10 秒自动刷新 &middot; (◕ᴗ◕)
        </p>
      </footer> */}
    </div>
  );
}