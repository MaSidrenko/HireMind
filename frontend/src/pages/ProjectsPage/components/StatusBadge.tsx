import { statusLabels, workflowLabels } from "@/features/projects/projectDictionaries";
import { type OrderStatus, type WorkflowStage } from "@/features/projects/types";

export function StatusBadge({ status }: {status: OrderStatus}) {
	return <span className={`hm-badge hm-badge--${status}`}>{statusLabels[status]}</span>;
}

export function StageBadge({ stage }: { stage: WorkflowStage}) {
	return <span className="hm-badge hm-badge--stage">{workflowLabels[stage]}</span>;
}
