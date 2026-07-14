import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/constants";

const icons = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

export function StatusBadge({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const meta = STATUS_META[status];
  const Icon = icons[status];
  return (
    <Badge tone={meta.tone}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}
