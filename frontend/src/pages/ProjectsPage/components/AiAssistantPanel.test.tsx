import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { askProjectAi, generateAiBrief,} from "../../../features/aiAssistant/aiAssistntAPI"
import type { AiBriefResult } from "../../../features/aiAssistant/types";
import type { ProjectOrder } from "../../../features/projects/types";
import { AiAssistantPanel } from "./AiAssistantPanel";

vi.mock("@/features/aiAssistant/aiAssistntAPI", () => ({
	askProjectAi: vi.fn(),
	generateAiBrief: vi.fn(),
}));

const mockedAskProjectAi = vi.mocked(askProjectAi);
const mockedGenerateAiBrief = vi.mocked(generateAiBrief);

const order = {
	id: 10,
	title: "Лендинг",
	category: "Дизайн",
	rawDescription: "Нужно сделать лендинг.",
} as ProjectOrder;

const briefResult: AiBriefResult = {
	summary: "AI предлагает уточнить сроки.",
	briefSections: {
		goal: "Цель",
		audience: "Аудитория",
		screens: "Экраны",
		features: "Функции",
		content: "Контент",
		design: "Дизайн",
		constraints: "Ограничения",
		openQuestions: "Вопросы",
	},
	questions: [],
	risks: [],
};

describe("AiAssistantPanel", () => {
	beforeEach(() => {
		mockedAskProjectAi.mockReset();
		mockedGenerateAiBrief.mockReset();
		mockedAskProjectAi.mockResolvedValue("Добавьте критерии приемки.");
		mockedGenerateAiBrief.mockResolvedValue(briefResult);
	});

	it("does not send empty prompt", async () => {
		const user = userEvent.setup();

		render(<AiAssistantPanel order={order} />);

		await user.click(screen.getByRole("button", { name: "Спросить ИИ" }));

		expect(mockedAskProjectAi).not.toHaveBeenCalled();
	});

	it("asks AI assistant and renders answer", async () => {
		const user = userEvent.setup();

		render(<AiAssistantPanel order={order} />);

		await user.type(
			screen.getByPlaceholderText("Например: какие риски есть по срокам?"),
			"Что уточнить?",
		);
		await user.click(screen.getByRole("button", { name: "Спросить ИИ" }));

		expect(await screen.findByText("Добавьте критерии приемки.")).toBeInTheDocument();
		expect(mockedAskProjectAi).toHaveBeenCalledWith(order, "Что уточнить?");
	});

	it("shows fallback answer when assistant request fails", async () => {
		const user = userEvent.setup();
		mockedAskProjectAi.mockRejectedValueOnce(new Error("network"));

		render(<AiAssistantPanel order={order} />);

		await user.type(
			screen.getByPlaceholderText("Например: какие риски есть по срокам?"),
			"Что уточнить?",
		);
		await user.click(screen.getByRole("button", { name: "Спросить ИИ" }));

		expect(
			await screen.findByText(/Не удалось получить ответ ИИ/),
		).toBeInTheDocument();
	});

	it("generates brief and applies generated result", async () => {
		const user = userEvent.setup();
		const onApply = vi.fn();

		render(<AiAssistantPanel order={order} onApply={onApply} />);

		await user.click(screen.getByRole("button", { name: "Обновить бриф ИИ" }));
		await screen.findByText("AI предлагает уточнить сроки.");
		await user.click(screen.getByRole("button", { name: "Применить результат" }));

		expect(mockedGenerateAiBrief).toHaveBeenCalledWith({
			title: "Лендинг",
			category: "Дизайн",
			rawDescription: "Нужно сделать лендинг.",
		});
		expect(onApply).toHaveBeenCalledWith(briefResult);
	});

	it("keeps brief apply button hidden when generation fails", async () => {
		const user = userEvent.setup();
		mockedGenerateAiBrief.mockRejectedValueOnce(new Error("network"));

		render(<AiAssistantPanel order={order} onApply={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: "Обновить бриф ИИ" }));

		expect(
			await screen.findByText(/Не удалось обновить бриф ИИ/),
		).toBeInTheDocument();
		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: "Применить результат" }),
			).not.toBeInTheDocument();
		});
	});
});
