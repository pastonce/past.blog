import type { DeviceState } from "@/lib/status-api";

const platformIcons: Record<string, string> = {
  windows: "\u{1F4BB}",
  android: "\u{1F4F1}",
  macos: "\u{1F5A5}",
  linux: "\u{1F427}",
};

function timeAgo(isoStr: string): string {
  if (!isoStr) return " unknown";
  const ts = new Date(isoStr).getTime();
  if (isNaN(ts)) return " unknown";
  const diff = Date.now() - ts;
  if (diff < 0) return " just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return " just now";
  if (mins < 60) return ` ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return ` ${hrs}h ago`;
  return ` ${Math.floor(hrs / 24)}d ago`;
}

function getDeviceActivity(device: DeviceState): string {
  if (device.is_online !== 1) {
    return "阿巴阿巴";
  }
  if (!device.app_name || device.app_name === "idle") {
    return "待机中";
  }
  return device.app_name;
}

interface DeviceCardProps {
device: DeviceState;
selected?: boolean;
onSelect?: () => void;
}

export default function DeviceCard({ device, selected, onSelect }: DeviceCardProps) {
  const isOnline = device.is_online === 1;
  const icon = platformIcons[device.platform] || "\u{1F4BB}";
  const battery = device.extra;
  const hasBattery = battery && typeof battery.battery_percent === "number";

  return (
    <div
      className={`card-decorated rounded-md px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-all min-w-42.5 shrink-0 lg:min-w-0 lg:shrink ${
        selected
          ? "border-l-[3px] border-l-primary bg-(--status-sakura-bg,rgba(255,183,197,0.1))"
          : ""
      }`}
      onClick={onSelect}
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold truncate">{device.device_name}</span>
          {isOnline && hasBattery && (
            <span className="text-[10px] text-(--status-text-muted) shrink-0">
              {battery.battery_charging ? "\u26A1" : "\u{1F50B}"}{battery.battery_percent}%
            </span>
          )}
          <span className="text-xs shrink-0" title={isOnline ? "Online" : "Offline"}>
            {isOnline ? "(=^-\u03C9-^=)" : "(-.-)zzZ"}
          </span>
        </div>
        <span className="text-[10px] text-(--status-text-muted) truncate">
          {getDeviceActivity(device)} •
        </span>
        <span className="text-[10px] text-(--status-text-muted)">
          {isOnline ? timeAgo(device.last_seen_at) : " offline"}
        </span>
      </div>
    </div>
  );
}
