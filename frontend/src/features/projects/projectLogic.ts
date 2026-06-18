import { briefSections } from "./projectDictionaries";
import { normalizeRiskItems } from "../aiAssistant/normalizeAiBriefResult";
import type {
	BudgetType,
	BriefSections,
	ClarificationQuestion,
	CreateProjectInput,
	Currency,
	DoneCriterion,
	OrderStatus,
	ProjectOrder,
	RiskItem,
	ScopeItem,
	WorkflowStage,
} from "./types";

const orderStatuses: OrderStatus[] = [
	"Draft",
	"Published",
	"Paused",
	"In_Progress",
	"Completed",
	"Cancelled",
	"Archived",
];

const workflowStages: WorkflowStage[] = [
	"raw",
	"clarification",
	"brief",
	"review",
	"approved",
];
const currencies: Currency[] = ["RUB", "USD", "EUR"];
const budgetTypes: BudgetType[] = ["fixed", "hourly"];
const backendCategoryToUi = {
	Development: "Разработка",
	Design: "Дизайн",
	Marketing: "Маркетинг",
	Content: "Контент",
	MobileDevelopment: "Мобильная разработка",
} as const;

function pickValue<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fallback: T,
): T {
	return typeof value === "string" && allowed.includes(value as T)
		? (value as T)
		: fallback;
}

function safeNumber(value: unknown, fallback = 0) {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: fallback;
}

function safeNullableNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeString(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function normalizeCategory(value: unknown) {
	if (typeof value !== "string") {
		return "Разработка";
	}

	return backendCategoryToUi[value as keyof typeof backendCategoryToUi] ?? value;
}

function safeDate(value: unknown) {
	return typeof value === "string" && value
		? value
		: new Date().toISOString();
}

function ratio(done: number, total: number) {
	return total > 0 ? done / total : 0;
}

export function makeBrief(
	title: string,
	raw: string,
	category: string,
): BriefSections {
	return {
		goal: `Получить понятный результат по задаче: ${title}.`,
		audience:
			category === "Маркетинг"
				? "Потенциальные клиенты и команда маркетинга."
				: "Конечные пользователи, заказчик и исполнитель.",
		screens:
			"Основной экран, детали, форма заявки, состояния загрузки и ошибки.",
		features:
			"Просмотр, создание, редактирование, фильтрация и ключевые действия.",
		content:
			"Тексты, изображения, доступы и материалы передаются до старта.",
		design: "Аккуратный рабочий интерфейс без лишней лендинговой декоративности.",
		constraints:
			"Без сложных платежей, CRM, escrow и внутреннего чата в первой версии.",
		openQuestions: raw.trim()
			? `Исходный запрос: ${raw}`
			: "Нужно добавить исходное описание.",
	};
}

export function makeQuestions(category: string): ClarificationQuestion[] {
	const questions: ClarificationQuestion[] = [
		{
			id: 1,
			question: "Что будет считаться успешной сдачей проекта?",
			importance: "high",
			answer: "",
			options: ["Рабочий MVP", "Готовый релиз", "Кликабельный прототип"],
		},
		{
			id: 2,
			question: "Какие материалы уже готовы?",
			importance: "medium",
			answer: "",
			options: ["Тексты", "Дизайн", "Материалы нужно создать"],
		},
		{
			id: 3,
			question: "Что точно не входит в первую версию?",
			importance: "high",
			answer: "",
			options: ["Платежи", "Чат", "Админка", "Аналитика"],
		},
	];

	return category === "Дизайн"
		? [
				...questions,
				{
					id: 4,
					question: "Есть ли брендбук или референсы?",
					importance: "medium",
					answer: "",
					options: [
						"Есть брендбук",
						"Есть референсы",
						"Нужен стиль с нуля",
					],
				},
			]
		: questions;
}

export function makeScope(): ScopeItem[] {
	return [
		{
			id: 1,
			title: "Структурированный бриф",
			description: "Цели, функции, ограничения и вопросы.",
			bucket: "included",
		},
		{
			id: 2,
			title: "Основные экраны",
			description: "Рабочая desktop/mobile версия.",
			bucket: "included",
		},
		{
			id: 3,
			title: "Escrow и платежи",
			description: "Отдельный этап после MVP.",
			bucket: "excluded",
		},
		{
			id: 4,
			title: "Расширенная аналитика",
			description: "Можно добавить после проверки спроса.",
			bucket: "later",
		},
	];
}

export function makeDone(): DoneCriterion[] {
	return [
		{
			id: 1,
			text: "Основной сценарий работает без ручных обходов.",
			checked: true,
		},
		{
			id: 2,
			text: "Есть пустые, ошибочные и загрузочные состояния.",
			checked: false,
		},
		{
			id: 3,
			text: "Интерфейс не ломается на мобильной ширине.",
			checked: false,
		},
	];
}

export function makeRisks(): RiskItem[] {
	return [
		{
			id: 1,
			title: "Не хватает контента",
			level: "medium",
			impact: "Исполнитель будет додумывать продуктовые детали.",
			action: "Собрать список текстов, изображений и доступов.",
			resolved: false,
		},
		{
			id: 2,
			title: "Не определён критерий готовности",
			level: "high",
			impact: "Появятся споры о завершении работы.",
			action: "Довести DoD до проверяемого списка.",
			resolved: false,
		},
	];
}

export function calculateReadiness(order: ProjectOrder) {
	const brief = ratio(
		briefSections.filter(
			({ key }) => order.briefSections[key].trim().length > 20,
		).length,
		briefSections.length,
	);
	const answers = ratio(
		order.clarificationQuestions.filter((q) => q.answer.trim()).length,
		order.clarificationQuestions.length,
	);
	const done = ratio(
		order.doneCriteria.filter((item) => item.checked).length,
		order.doneCriteria.length,
	);
	const risks = ratio(
		order.risks.filter((item) => item.resolved).length,
		order.risks.length,
	);
	const approvals =
		(Number(order.approvals.client) + Number(order.approvals.freelancer)) /
		2;

	return Math.round(
		brief * 30 + answers * 25 + done * 20 + risks * 10 + approvals * 15,
	);
}

export function normalizeProjectOrder(
	order: Partial<ProjectOrder>,
): ProjectOrder {
	const rawOrder = order as Record<string, unknown>;
	const title = safeString(order.title, "Без названия");
	const rawDescription = safeString(order.rawDescription);
	const category = normalizeCategory(order.category);
	const proposals = Array.isArray(order.proposals) ? order.proposals : [];
	const clientDoneApproved =
		typeof rawOrder.clientDoneApproved === "boolean"
			? rawOrder.clientDoneApproved
			: order.approvals?.clientDone;
	const freelancerDoneApproved =
		typeof rawOrder.freelancerDoneApproved === "boolean"
			? rawOrder.freelancerDoneApproved
			: order.approvals?.freelancerDone;
	const fallbackBrief = makeBrief(title, rawDescription, category);
	const brief = briefSections.reduce((acc, { key }) => {
		const value = order.briefSections?.[key];
		acc[key] = typeof value === "string" ? value : fallbackBrief[key];
		return acc;
	}, {} as BriefSections);

	const normalized: ProjectOrder = {
		id: safeNumber(order.id),
		hirerId: safeNumber(order.hirerId),
		hirerName: safeString(order.hirerName, "Заказчик"),
		hirerRating: safeNumber(order.hirerRating),
		selectedFreelancerId:
			typeof order.selectedFreelancerId === "number"
				? order.selectedFreelancerId
				: null,
		selectedFreelancerName:
			typeof order.selectedFreelancerName === "string"
				? order.selectedFreelancerName
				: null,
		selectedFreelancerRating: safeNullableNumber(
			order.selectedFreelancerRating,
		),
		title,
		shortDescription: safeString(
			order.shortDescription,
			rawDescription.slice(0, 150),
		),
		rawDescription,
		technicalSpecification: safeString(order.technicalSpecification),
		status: pickValue(order.status, orderStatuses, "Draft"),
		workflowStage: pickValue(order.workflowStage, workflowStages, "raw"),
		category,
		budgetMin: safeNumber(order.budgetMin),
		budgetMax: safeNumber(order.budgetMax, safeNumber(order.budgetMin)),
		currency: pickValue(order.currency, currencies, "RUB"),
		budgetType: pickValue(order.budgetType, budgetTypes, "fixed"),
		skills: Array.isArray(order.skills) ? order.skills : [],
		proposalsCount: proposals.length,
		proposals,
		canClientDelete:
			typeof order.canClientDelete === "boolean"
				? order.canClientDelete
				: !(
						typeof order.selectedFreelancerId === "number" &&
						Number.isFinite(order.selectedFreelancerId)
					) && proposals.length === 0,
		publishedAt:
			typeof order.publishedAt === "string" ? order.publishedAt : null,
		completedAt:
			typeof order.completedAt === "string" ? order.completedAt : null,
		updatedAt: safeDate(order.updatedAt),
		companyName: safeString(order.companyName),
		aiGenerated: Boolean(order.aiGenerated),
		readinessScore: 0,
		briefSections: brief,
		clarificationQuestions: Array.isArray(order.clarificationQuestions)
			? order.clarificationQuestions
			: [],
		scopeItems: Array.isArray(order.scopeItems) ? order.scopeItems : [],
		doneCriteria: Array.isArray(order.doneCriteria)
			? order.doneCriteria
			: [],
		risks: normalizeRiskItems(Array.isArray(order.risks) ? order.risks : []),
		approvals: {
			client: Boolean(order.approvals?.client),
			freelancer: Boolean(order.approvals?.freelancer),
			clientDone: Boolean(clientDoneApproved),
			freelancerDone: Boolean(freelancerDoneApproved),
		},
		clientRatingByFreelancer: safeNullableNumber(
			order.clientRatingByFreelancer,
		),
		freelancerRatingByClient: safeNullableNumber(
			order.freelancerRatingByClient,
		),
	};

	return { ...normalized, readinessScore: calculateReadiness(normalized) };
}

export function createProject(input: CreateProjectInput): ProjectOrder {
	const now = new Date().toISOString();
	const order: ProjectOrder = {
		id: Date.now(),
		hirerId: input.hirerId,
		hirerName: input.hirerName,
		selectedFreelancerId: null,
		selectedFreelancerName: null,
		title: input.title,
		shortDescription: input.rawDescription.slice(0, 150),
		rawDescription: input.rawDescription,
		technicalSpecification:
			input.aiSummary || `AI-черновик ТЗ для "${input.title}".`,
		status: "Draft",
		workflowStage: "clarification",
		category: input.category,
		budgetMin: input.minPrice,
		budgetMax: input.maxPrice,
		currency: input.currency,
		budgetType: input.payment,
		skills: input.skills.length ? input.skills : ["Discovery"],
		proposalsCount: 0,
		proposals: [],
		canClientDelete: true,
		publishedAt: null,
		completedAt: null,
		updatedAt: now,
		companyName: input.companyName || "",
		aiGenerated: Boolean(input.aiSummary || input.briefSections),
		readinessScore: 0,
		briefSections:
			input.briefSections ??
			makeBrief(input.title, input.rawDescription, input.category),
		clarificationQuestions:
			input.clarificationQuestions ?? makeQuestions(input.category),
		scopeItems: input.scopeItems ?? makeScope(),
		doneCriteria: input.doneCriteria ?? makeDone(),
		risks: input.risks ?? makeRisks(),
		approvals: {
			client: false,
			freelancer: false,
			clientDone: false,
			freelancerDone: false,
		},
		hirerRating: 0,
		selectedFreelancerRating: null,
		clientRatingByFreelancer: null,
		freelancerRatingByClient: null,
	};

	return { ...order, readinessScore: calculateReadiness(order) };
}
