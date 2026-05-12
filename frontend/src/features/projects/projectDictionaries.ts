import type {
	BriefSectionKey,
	BudgetType,
	OrderStatus,
	RiskLevel,
	ScopeBucket,
	WorkflowStage,
	ProposalStatus,
} from "./types";

export const statusLabels: Record<OrderStatus, string> = {
	draft: "Черновик",
	published: "Опубликован",
	paused: "На паузе",
	in_progress: "В работе",
	completed: "Завершён",
	cancelled: "Отменён",
	archived: "Архив",
};

export const workflowLabels: Record<WorkflowStage, string> = {
	raw: "Сырой запрос",
	clarification: "Уточнения",
	brief: "Бриф",
	review: "Ревью",
	approved: "Согласован",
};

export const budgetTypeLabels: Record<BudgetType, string> = {
	fixed: "Фикс",
	hourly: "Почасово",
};

export const scopeBucketLabels: Record<ScopeBucket, string> = {
	included: "В scope",
	excluded: "Вне scope",
	later: "Позже",
};

export const riskLevelLabels: Record<RiskLevel, string> = {
	low: "Низкий",
	medium: "Средний",
	high: "Высокий",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
	pending: "Ожидает решения",
	accepted: "Выбран",
	declined: "Отклонён",
	withdrawn: "Отозван",
};

export const briefSections: Array<{ key: BriefSectionKey; title: string }> = [
	{ key: "goal", title: "Цель" },
	{ key: "audience", title: "Аудитория" },
	{ key: "screens", title: "Экраны" },
	{ key: "features", title: "Функции" },
	{ key: "content", title: "Контент" },
	{ key: "design", title: "Дизайн" },
	{ key: "constraints", title: "Ограничения" },
	{ key: "openQuestions", title: "Вопросы" },
];
