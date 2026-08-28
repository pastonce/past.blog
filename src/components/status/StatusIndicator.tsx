export default function StatusIndicator({ online }: { online: boolean }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: online ? "var(--status-secondary)" : "var(--status-border)" }}
      title={online ? "Online" : "Offline"}
    />
  );
}
