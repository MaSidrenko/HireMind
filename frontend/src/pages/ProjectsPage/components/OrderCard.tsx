import { budgetTypeLabels } from "@/features/projects/projectDictionaries";
import { formatBudget } from "@/features/projects/projectFormatters";
import { formatDate } from "@/features/projects/projectFormatters";
import { type ProjectOrder } from "@/features/projects/types";
import { StageBadge, StatusBadge } from "./StatusBadge";

type OrderCardProps = {
	order: ProjectOrder;
	onOpen: (id: number) => void;
};

export function OrderCard({ order, onOpen}: OrderCardProps) {
	return (
		<article className="order-row">
			<div className="order-row__main">
				<div className="order-row__badges">
					<StatusBadge status={order.status}/>
					<StageBadge stage={order.workflowStage} />
					{order.aiGenerated ? <span className="hm-badge hm-badge--ai">AI-ТЗ</span>: null}
				</div>
				<h2>{order.title}</h2>
				<p>{order.shortDescription}</p>
				<div className="order-row__skills">
					{order.skills.slice(0, 4).map((skill) => (
						<span key={skill}>{skill}</span>
					))}
				</div>
			</div>
			<div className="order-row__side">
				<strong>{formatBudget(order)}</strong>
				<span>{budgetTypeLabels[order.budgetType]} · {order.proposalsCount} откликов</span>
				<span>Обновлён {formatDate(order.updatedAt)}</span>
				<button type="button" className="hm-button" onClick={() => onOpen(order.id)}>
					Открыть
				</button>
			</div>
		</article>
	);
}