import { afterEach, describe, expect, it, vi } from "vitest";
import {
	calculateReadiness,
	createProject,
	makeBrief,
	makeQuestions,
} from "./projectLogic";
import type { ProjectOrder } from "./types";

describe("projectLogic", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("creates a normalized project draft with generated brief data", () => {
		vi.spyOn(Date, "now").mockReturnValue(12345);

		const project = createProject({
			hirerId: 7,
			hirerName: "Анна Заказчик",
			title: "Лендинг",
			companyName: "",
			category: "Дизайн",
			rawDescription: "Нужно сделать понятный лендинг для дипломного проекта.",
			budgetMin: 10000,
			budgetMax: 25000,
			currency: "RUB",
			budgetType: "fixed",
			skills: [],
		});

		expect(project).toMatchObject({
			id: 12345,
			hirerId: 7,
			hirerName: "Анна Заказчик",
			status: "draft",
			workflowStage: "clarification",
			companyName: "Новая компания",
			skills: ["Discovery"],
			aiGenerated: true,
		});
		expect(project.briefSections.goal).toContain("Лендинг");
		expect(project.clarificationQuestions).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ question: "Есть ли брендбук или референсы?" }),
			]),
		);
	});

	it("calculates readiness from brief, answers, done criteria, risks and approvals", () => {
		const order = {
			briefSections: {
				goal: "Достаточно длинная цель проекта для проверки готовности.",
				audience: "Достаточно длинное описание аудитории для проверки.",
				screens: "",
				features: "",
				content: "",
				design: "",
				constraints: "",
				openQuestions: "",
			},
			clarificationQuestions: [
				{ answer: "Ответ", question: "", importance: "high", id: 1, options: [] },
				{ answer: "", question: "", importance: "medium", id: 2, options: [] },
			],
			doneCriteria: [
				{ id: 1, text: "Готово", checked: true },
				{ id: 2, text: "Не готово", checked: false },
			],
			risks: [
				{ id: 1, title: "", level: "low", impact: "", action: "", resolved: true },
				{ id: 2, title: "", level: "high", impact: "", action: "", resolved: false },
			],
			approvals: { client: true, freelancer: false },
		}  as unknown as ProjectOrder;

		expect(calculateReadiness(order)).toBe(43);
	});

	it("adds design-specific clarification question only for design category", () => {
		expect(makeQuestions("Дизайн")).toHaveLength(4);
		expect(makeQuestions("Маркетинг")).toHaveLength(3);
		expect(makeBrief("SMM", "", "Маркетинг").audience).toContain(
			"Потенциальные клиенты",
		);
	});
});
