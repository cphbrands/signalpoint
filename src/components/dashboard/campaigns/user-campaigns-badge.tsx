type Props = {
  status?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-blue-500/15 text-blue-300" },
  queued: { label: "Queued", className: "bg-yellow-500/15 text-yellow-300" },
  sending: { label: "Sending", className: "bg-purple-500/15 text-purple-300" },
  processing: { label: "Processing", className: "bg-purple-500/15 text-purple-300" },
  completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-300" },
  delivered: { label: "Delivered", className: "bg-emerald-500/15 text-emerald-300" },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-300" },
  error: { label: "Error", className: "bg-red-500/15 text-red-300" },
  draft: { label: "Draft", className: "bg-zinc-500/15 text-zinc-300" },
};

export default function CampaignStatusBadge({ status }: Props) {
  const key = String(status || "unknown").toLowerCase();
  const config =
    STATUS_CONFIG[key] ||
    ({ label: key === "unknown" ? "Unknown" : key, className: "bg-zinc-500/15 text-zinc-300" });

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
