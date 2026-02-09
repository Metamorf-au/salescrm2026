import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { statusConfig } from "./constants";

export default function StatusBadge({ status }) {
  const cfg = statusConfig(status);
  const icons = { green: CheckCircle, amber: AlertTriangle, red: XCircle };
  const Icon = icons[status] || icons.red;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon size={12} />{cfg.label}
    </span>
  );
}
