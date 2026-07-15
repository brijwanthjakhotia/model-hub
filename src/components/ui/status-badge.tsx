import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_META, type ModelStatusValue } from "@/lib/constants";

const icons: Record<ModelStatusValue, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

export function StatusBadge({ status }: { status: ModelStatusValue }) {
  const meta = STATUS_META[status];
  const Icon = icons[status];
  return (
    <Badge tone={meta.tone}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}
