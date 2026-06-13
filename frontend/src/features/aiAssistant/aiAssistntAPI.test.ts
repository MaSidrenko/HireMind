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
	risks: [],
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
