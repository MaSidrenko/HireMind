import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../shared";
import type { ProjectOrder } from "../../features/projects/types";
import { askProjectAi, generateAiBrief } from "./aiAssistntAPI";
import type { AiBriefResult } from "./types";

vi.mock("../../shared", () => ({
	apiRequest: vi.fn(),
	AI_API: "/ai",
}));

const mockedApiRequest = vi.mocked(apiRequest);

const briefResult: AiBriefResult = {
	summary: "Нужно уточнить сроки и контент.",
	briefSections: {
		goal: "Запустить каталог услуг.",
		audience: "Заказчики и фрилансеры.",
		screens: "Главная, список, карточка.",
		features: "Фильтрация и заявки.",
		content: "Тексты заказчика.",
		design: "Черно-оранжевый интерфейс.",
		constraints: "Без платежей на MVP.",
		openQuestions: "Нужны доступы?",
	},
	questions: [],
	scopeItems: [],
	doneCriteria: [],
	risks: [],
};

const rawNarrativeBriefResult: AiBriefResult = {
	summary: "Нужно уточнить риски проекта.",
	briefSections: {
		goal: "Запустить каталог услуг.",
		audience: "Заказчики и фрилансеры.",
		screens: "Главная, список, карточка.",
		features: "Фильтрация и заявки.",
		content: "Тексты заказчика.",
		design: "Черно-оранжевый интерфейс.",
		constraints: "Без платежей на MVP.",
		openQuestions: "Нужны доступы?",
	},
	questions: [],
	scopeItems: [],
	doneCriteria: [],
	risks: [
		{
			id: 1,
			title:
				"Риски по срокам в данном проекте не указаны в контексте. Однако можно выделить потенциально возможные риски: - **Недостаточная детализация брифа** — не уточнено, нужна ли сохраняемость настроек темы между запусками. - **Несогласованность тем в интерфейсе** — без дополнительного тестирования возможны лишние доработки. - **Некорректное выделение ресурсов** — если стили и цвета будут плохо структурированы, это увеличит время на отладку. Следующие шаги: 1. Уточнить необходимость сохранения темы. 2. Добавить критерии проверки согласованности темы. 3. Определить сроки тестирования.",
			level: "medium",
			impact: "",
			action: "",
			resolved: false,
		},
	],
};

const order = {
	id: 12,
	title: "Лендинг",
	category: "Дизайн",
	rawDescription: "Нужно сделать промо-страницу.",
} as ProjectOrder;

describe("aiAssistntAPI", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("generates brief from order draft fields", async () => {
		const input = {
			title: "Лендинг",
			category: "Дизайн",
			rawDescription: "Нужно сделать промо-страницу.",
		};
		mockedApiRequest.mockResolvedValueOnce(briefResult);

		await expect(generateAiBrief(input)).resolves.toEqual(briefResult);

		expect(mockedApiRequest).toHaveBeenCalledWith("/ai/briefs/generate", {
			method: "POST",
			body: input,
		});
	});

	it("normalizes narrative AI risks into structured items", async () => {
		mockedApiRequest.mockResolvedValueOnce(rawNarrativeBriefResult);

		const result = await generateAiBrief({
			title: "Лендинг",
			category: "Дизайн",
			rawDescription: "Нужно сделать промо-страницу.",
		});

		expect(result.risks).toHaveLength(3);
		expect(result.risks[0]).toEqual(
			expect.objectContaining({
				title: "Недостаточная детализация брифа",
			}),
		);
		expect(result.risks[1]).toEqual(
			expect.objectContaining({
				title: "Несогласованность тем в интерфейсе",
			}),
		);
		expect(result.risks[2]).toEqual(
			expect.objectContaining({
				title: "Некорректное выделение ресурсов",
			}),
		);
		expect(result.risks[0].action).toContain("Уточнить необходимость сохранения темы");
	});

	it("asks project assistant by project id and returns answer text", async () => {
		mockedApiRequest.mockResolvedValueOnce({ answer: "Добавьте критерии приемки." });

		await expect(askProjectAi(order, "Что уточнить?")).resolves.toBe(
			"Добавьте критерии приемки.",
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/ai/project-assistant", {
			method: "POST",
			body: {
				projectId: 12,
				prompt: "Что уточнить?",
			},
		});
	});
});
