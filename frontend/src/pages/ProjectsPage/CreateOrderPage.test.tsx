import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectRequest } from "../../features/projects/projectsApi";
import { generateAiBrief } from "../../features/aiAssistant/aiAssistntAPI";
import { useAuth } from "../../features/Auth/AuthContext";
import type { ProjectOrder } from "../../features/projects/types";
import CreateOrderPage from "./CreateOrderPage";

vi.mock("../../features/projects/projectsApi.ts", () => ({
	createProjectRequest: vi.fn()
}));

vi.mock("../../features/aiAssistant/aiAssistntAPI.ts", () => ({
	generateAiBrief: vi.fn(),
}));

vi.mock("../../features/Auth/AuthContext.tsx", () => ({
	useAuth: vi.fn(),
}));

const mockedCreateProjectRequest = vi.mocked(createProjectRequest);
const mockedGenerateAiBrief = vi.mocked(generateAiBrief);
const mockedUseAuth = vi.mocked(useAuth);

describe("CreateOrderPage", () => {
	beforeEach(() => {
		mockedUseAuth.mockReturnValue({
			user: {
				id: 7,
				fullName: "Анна Заказчик",
				email: "anna@example.com",
				role: "client",
				contacts: {},
				isOnline: true,
				companyName: "HireMind",
			},
			isAuthenticated: true,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);
		mockedCreateProjectRequest.mockResolvedValue({
			id: 99,
			updatedAt: "2026-05-13T00:00:00.000Z",
		} as ProjectOrder);
		mockedGenerateAiBrief.mockResolvedValue({
			summary: "AI summary",
			briefSections: {
				goal: "",
				audience: "",
				screens: "",
				features: "",
				content: "",
				design: "",
				constraints: "",
				openQuestions: "",
			},
			questions: [],
			risks: [],
		});
	});

	it("returns to orders list when back button is clicked", async () => {
		const user = userEvent.setup();
		const onBack = vi.fn();

		render(<CreateOrderPage onBack={onBack} onCreated={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: "Назад" }));

		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it("does not submit invalid short order draft", async () => {
		const user = userEvent.setup();

		render(<CreateOrderPage onBack={vi.fn()} onCreated={vi.fn()} />);

		await user.type(screen.getByPlaceholderText("Название заказа"), "Баг");
		await user.type(
			screen.getByPlaceholderText("Сырой запрос заказчика"),
			"Коротко",
		);
		await user.click(screen.getByRole("button", { name: "Сформировать заказ" }));

		expect(
			screen.getByText("Заполните название и описание задачи подробнее."),
		).toBeInTheDocument();
		expect(mockedCreateProjectRequest).not.toHaveBeenCalled();
	});

	it("creates order with separate min and max budget values", async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();

		render(<CreateOrderPage onBack={vi.fn()} onCreated={onCreated} />);

		await user.type(screen.getByPlaceholderText("Название заказа"), "Лендинг");
		await user.type(screen.getByPlaceholderText("Компания"), "HireMind");
		await user.selectOptions(screen.getAllByRole("combobox")[0], "Разработка");
		await user.type(
			screen.getByPlaceholderText("Сырой запрос заказчика"),
			"Нужно сделать понятный лендинг для дипломной демонстрации продукта.",
		);
		await user.type(screen.getByPlaceholderText("Цена от"), "10000");
		await user.type(screen.getByPlaceholderText("Цена до"), "25000");
		await user.type(screen.getByPlaceholderText("Навыки через запятую"), "React, CSS");
		await user.click(screen.getByRole("button", { name: "Сформировать заказ" }));

		await waitFor(() => {
			expect(mockedCreateProjectRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					hirerId: 7,
					hirerName: "Анна Заказчик",
					budgetMin: 10000,
					budgetMax: 25000,
					skills: ["React", "CSS"],
				}),
			);
		});
		expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
	});

	it("shows create error when backend rejects order", async () => {
		const user = userEvent.setup();
		mockedCreateProjectRequest.mockRejectedValueOnce(new Error("network"));

		render(<CreateOrderPage onBack={vi.fn()} onCreated={vi.fn()} />);

		await user.type(screen.getByPlaceholderText("Название заказа"), "Лендинг");
		await user.selectOptions(screen.getAllByRole("combobox")[0], "Разработка");
		await user.type(
			screen.getByPlaceholderText("Сырой запрос заказчика"),
			"Нужно сделать понятный лендинг для дипломной демонстрации продукта.",
		);
		await user.type(screen.getByPlaceholderText("Цена от"), "10000");
		await user.type(screen.getByPlaceholderText("Цена до"), "25000");
		await user.type(screen.getByPlaceholderText("Навыки через запятую"), "React, CSS");
		await user.click(screen.getByRole("button", { name: "Сформировать заказ" }));

		expect(
			await screen.findByText("Не удалось создать заказ"),
		).toBeInTheDocument();
	});

	it("shows AI summary", async () => {
		const user = userEvent.setup();

		render(<CreateOrderPage onBack={vi.fn()} onCreated={vi.fn()} />);

		await user.type(screen.getByPlaceholderText("Название заказа"), "Лендинг");
		await user.selectOptions(screen.getAllByRole("combobox")[0], "Разработка");
		await user.type(
			screen.getByPlaceholderText("Сырой запрос заказчика"),
			"Нужно сделать понятный лендинг для дипломной демонстрации продукта.",
		);
		await user.click(screen.getByRole("button", { name: "Проанализировать" }));

		expect(await screen.findByText("AI summary")).toBeInTheDocument();
	});

	it("shows AI error when brief generation fails", async () => {
		const user = userEvent.setup();
		mockedGenerateAiBrief.mockRejectedValueOnce(new Error("network"));

		render(<CreateOrderPage onBack={vi.fn()} onCreated={vi.fn()} />);

		await user.type(screen.getByPlaceholderText("Название заказа"), "Лендинг");
		await user.selectOptions(screen.getAllByRole("combobox")[0], "Разработка");
		await user.type(
			screen.getByPlaceholderText("Сырой запрос заказчика"),
			"Нужно сделать понятный лендинг для дипломной демонстрации продукта.",
		);
		await user.click(screen.getByRole("button", { name: "Проанализировать" }));

		expect(
			await screen.findByText("Не удалось получить AI-подсказку"),
		).toBeInTheDocument();
	});
});
