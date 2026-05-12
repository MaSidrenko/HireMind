import { briefSections } from "./projectDictionaries";
import type {
	BriefSections,
	ClarificationQuestion,
	CreateProjectInput,
	DoneCriterion,
	ProjectOrder,
	RiskItem,
	ScopeItem,
} from "./types";

export function makeBrief(title: string, raw: string, category: string): BriefSections {
	return {
		goal: `Получить понятный результат по задаче: ${title}.`,
		audience:
			category === "Маркетинг"
				? "Потенциальные клиенты и команда маркетинга."
				: "Конечные пользователи, заказчик и исполнитель.",
		screens: "Основной экран, детали, форма заявки, состояния загрузки и ошибки.",
		features: "Просмотр, создание, редактирование, фильтрация и ключевые действия.",
		content: "Тексты, изображения, доступы и материалы передаются до старта.",
		design: "Аккуратный рабочий интерфейс без лишней лендинговой декоративности.",
		constraints: "Без сложных платежей, CRM, escrow и внутреннего чата в первой версии.",
		openQuestions: raw.trim() ? `Исходный запрос: ${raw}` : "Нужно добавить исходное описание.",
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
					options: ["Есть брендбук", "Есть референсы", "Нужен стиль с нуля"],
				},
			]
		: questions;
}

export function makeScope(): ScopeItem[] {
	return [
		{ id: 1, title: "Структурированный бриф", description: "Цели, функции, ограничения и вопросы.", bucket: "included" },
		{ id: 2, title: "Основные экраны", description: "Рабочая desktop/mobile версия.", bucket: "included" },
		{ id: 3, title: "Escrow и платежи", description: "Отдельный этап после MVP.", bucket: "excluded" },
		{ id: 4, title: "Расширенная аналитика", description: "Можно добавить после проверки спроса.", bucket: "later" },
	];
}

export function makeDone(): DoneCriterion[] {
	return [
		{ id: 1, text: "Основной сценарий работает без ручных обходов.", checked: true },
		{ id: 2, text: "Есть пустые, ошибочные и загрузочные состояния.", checked: false },
		{ id: 3, text: "Интерфейс не ломается на мобильной ширине.", checked: false },
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
	const brief = briefSections.filter(({ key }) => order.briefSections[key].trim().length > 20).length / briefSections.length;
	const answers = order.clarificationQuestions.filter((q) => q.answer.trim()).length / order.clarificationQuestions.length;
	const done = order.doneCriteria.filter((item) => item.checked).length / order.doneCriteria.length;
	const risks = order.risks.filter((item) => item.resolved).length / order.risks.length;
	const approvals = (Number(order.approvals.client) + Number(order.approvals.freelancer)) / 2;

	return Math.round(brief * 30 + answers * 25 + done * 20 + risks * 10 + approvals * 15);
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
		technicalSpecification: `AI-черновик ТЗ для "${input.title}".`,
		status: "draft",
		workflowStage: "clarification",
		category: input.category,
		budgetMin: input.budgetMin,
		budgetMax: input.budgetMax,
		currency: input.currency,
		budgetType: input.budgetType,
		skills: input.skills.length ? input.skills : ["Discovery"],
		proposalsCount: 0,
		proposals: [],
		publishedAt: null,
		updatedAt: now,
		companyName: input.companyName || "Новая компания",
		aiGenerated: true,
		readinessScore: 0,
		briefSections: makeBrief(input.title, input.rawDescription, input.category),
		clarificationQuestions: makeQuestions(input.category),
		scopeItems: makeScope(),
		doneCriteria: makeDone(),
		risks: makeRisks(),
		approvals: { client: false, freelancer: false },
	};

	return { ...order, readinessScore: calculateReadiness(order) };
}
