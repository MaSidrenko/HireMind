import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../features/Auth/AuthContext";
import type { ProjectOrder } from "../../features/projects/types";
import ProjectWorkspacePage from "./ProjectWorkspacePage";


vi.mock("../../features/Auth/AuthContext.tsx", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function makeOrder(partial: Partial<ProjectOrder> = {}): ProjectOrder {
	return {
		id: 1,
		hirerId: 7,
		hirerName: "Анна Заказчик",
		selectedFreelancerId: null,
		selectedFreelancerName: null,
		title: "Лендинг для диплома",
		shortDescription: "Короткое описание",
		rawDescription: "Нужно сделать понятный лендинг для демонстрации дипломного проекта.",
		technicalSpecification: "",
		status: "draft",
		workflowStage: "brief",
		category: "Веб-разработка",
		budgetMin: 10000,
		budgetMax: 25000,
		currency: "RUB",
		budgetType: "fixed",
		skills: ["React"],
		proposalsCount: 0,
		proposals: [],
		publishedAt: null,
		updatedAt: "2026-05-13T00:00:00.000Z",
		companyName: "HireMind",
		aiGenerated: true,
		readinessScore: 80,
		briefSections: {
			goal: "Создать понятный MVP для дипломной демонстрации.",
			audience: "Комиссия, заказчики и фрилансеры проекта.",
			screens: "Главная, заказы, карточка заказа и профиль.",
			features: "Фильтрация, создание заказов и отклики.",
			content: "Данные заказчика и описание проекта.",
			design: "Черно-оранжевый рабочий интерфейс.",
			constraints: "Без платежей и внутреннего чата в MVP.",
			openQuestions: "Какие критерии приемки финальные?",
		},
		clarificationQuestions: [
			{
				id: 1,
				question: "Что считать готовым результатом?",
				importance: "high",
				answer: "Рабочий MVP",
				options: [],
			},
		],
		scopeItems: [
			{
				id: 1,
				title: "Основной сценарий",
				description: "Создать и открыть заказ.",
				bucket: "included",
			},
		],
		doneCriteria: [{ id: 1, text: "Сценарий работает", checked: true }],
		risks: [
			{
				id: 1,
				title: "Сроки",
				level: "medium",
				impact: "Можно не успеть",
				action: "Срезать лишнее",
				resolved: true,
			},
		],
		approvals: { client: false, freelancer: false },
		...partial,
	};
}

describe("ProjectWorkspacePage", () => {
	beforeEach(() => {
		mockedUseAuth.mockReturnValue({
			user: {
				id: 7,
				fullName: "Анна Заказчик",
				email: "anna@example.com",
				role: "client",
				contacts: {},
				isOnline: true,
			},
			isAuthenticated: true,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);
	});

	it("publishes owner draft order", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn().mockResolvedValue(undefined);

		render(
			<ProjectWorkspacePage
				order={makeOrder()}
				canEdit
				onBack={vi.fn()}
				onChange={onChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Опубликовать" }));

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "published",
					publishedAt: expect.any(String),
				}),
			);
		});
	});

	it("validates owner budget before saving draft changes", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<ProjectWorkspacePage
				order={makeOrder()}
				canEdit
				onBack={vi.fn()}
				onChange={onChange}
			/>,
		);

		await user.clear(screen.getByPlaceholderText("Цена до"));
		await user.type(screen.getByPlaceholderText("Цена до"), "5000");
		await user.click(screen.getByRole("button", { name: "Сохранить" }));

		expect(
			screen.getByText("Цена до не может быть меньше цены от"),
		).toBeInTheDocument();
		expect(onChange).not.toHaveBeenCalled();
	});

	it("allows freelancer to submit proposal for published order", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn().mockResolvedValue(undefined);
		mockedUseAuth.mockReturnValue({
			user: {
				id: 42,
				fullName: "Иван Фрилансер",
				email: "ivan@example.com",
				role: "freelancer",
				contacts: {},
				isOnline: true,
			},
			isAuthenticated: true,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as unknown as ReturnType<typeof useAuth>);

		render(
			<ProjectWorkspacePage
				order={makeOrder({ status: "published" })}
				canEdit={false}
				onBack={vi.fn()}
				onChange={onChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Откликнуться" }));

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					proposalsCount: 1,
					proposals: [
						expect.objectContaining({
							freelancerId: 42,
							freelancerName: "Иван Фрилансер",
							status: "pending",
						}),
					],
				}),
			);
		});
	});

	it("lets owner select freelancer proposal", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn().mockResolvedValue(undefined);

		render(
			<ProjectWorkspacePage
				order={makeOrder({
					status: "published",
					proposalsCount: 1,
					proposals: [
						{
							id: 10,
							projectId: 1,
							freelancerId: 42,
							freelancerName: "Иван Фрилансер",
							message: "Готов взять проект в работу.",
							price: 20000,
							currency: "RUB",
							estimatedDays: 7,
							status: "pending",
							createdAt: "2026-05-13T00:00:00.000Z",
						},
					],
				})}
				canEdit
				onBack={vi.fn()}
				onChange={onChange}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Выбрать исполнителя" }),
		);

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					selectedFreelancerId: 42,
					selectedFreelancerName: "Иван Фрилансер",
					workflowStage: "review",
					proposals: [
						expect.objectContaining({
							id: 10,
							status: "accepted",
						}),
					],
				}),
			);
		});
	});
});
