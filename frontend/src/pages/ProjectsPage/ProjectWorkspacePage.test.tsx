import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../features/Auth/AuthContext";
import {
	acceptProposalRequest,
	createProposalRequest,
} from "../../features/projects/projectsApi";
import type { ProjectOrder } from "../../features/projects/types";
import ProjectWorkspacePage from "./ProjectWorkspacePage";

vi.mock("../../features/Auth/AuthContext.tsx", () => ({
	useAuth: vi.fn(),
}));

vi.mock("../../features/projects/projectsApi", () => ({
	acceptProposalRequest: vi.fn(),
	clientMarkDone: vi.fn(),
	clientMarkReject: vi.fn(),
	createProposalRequest: vi.fn(),
	freelancerMarkDone: vi.fn(),
	rateOrderRequest: vi.fn(),
	updateProjectClarificationQuestionsRequest: vi.fn(),
	updateOrderApprovalRequest: vi.fn(),
	withdrawProposalRequest: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedAcceptProposalRequest = vi.mocked(acceptProposalRequest);
const mockedCreateProposalRequest = vi.mocked(createProposalRequest);

function makeOrder(partial: Partial<ProjectOrder> = {}): ProjectOrder {
	return {
		id: 1,
		hirerId: 7,
		hirerName: "Анна Заказчик",
		hirerRating: 0,
		selectedFreelancerId: null,
		selectedFreelancerName: null,
		selectedFreelancerRating: null,
		title: "Лендинг для диплома",
		shortDescription: "Короткое описание",
		rawDescription: "Нужно сделать понятный лендинг для демонстрации дипломного проекта.",
		technicalSpecification: "",
		status: "Draft",
		workflowStage: "brief",
		category: "Разработка",
		budgetMin: 10000,
		budgetMax: 25000,
		currency: "RUB",
		budgetType: "fixed",
		skills: ["React"],
		proposalsCount: 0,
		proposals: [],
		canClientDelete: true,
		publishedAt: null,
		completedAt: null,
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
		approvals: {
			client: false,
			freelancer: false,
			clientDone: false,
			freelancerDone: false,
		},
		clientRatingByFreelancer: null,
		freelancerRatingByClient: null,
		...partial,
	};
}

describe("ProjectWorkspacePage", () => {
	beforeEach(() => {
		mockedAcceptProposalRequest.mockReset();
		mockedCreateProposalRequest.mockReset();
		mockedUseAuth.mockReturnValue({
			user: {
				id: 7,
				fullName: "Анна Заказчик",
				email: "anna@example.com",
				role: "Client",
				rating: 0,
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
				onDelete={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Опубликовать" }));

		await waitFor(() => {
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "Published",
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
				onDelete={vi.fn()}
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
		const updatedOrder = makeOrder({
			status: "Published",
			proposalsCount: 1,
			proposals: [
				{
					id: 11,
					projectId: 1,
					freelancerId: 42,
					freelancerName: "Иван Фрилансер",
					message:
						"Здравствуйте! Готов обсудить задачу и взять проект в работу.",
					price: 10000,
					currency: "RUB",
					estimatedDays: 14,
					status: "pending",
					createdAt: "2026-05-13T00:00:00.000Z",
				},
			],
		});
		mockedCreateProposalRequest.mockResolvedValue(updatedOrder);

		mockedUseAuth.mockReturnValue({
			user: {
				id: 42,
				fullName: "Иван Фрилансер",
				email: "ivan@example.com",
				role: "Freelancer",
				rating: 0,
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
				order={makeOrder({ status: "Published" })}
				canEdit={false}
				onBack={vi.fn()}
				onChange={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Откликнуться" }));

		await waitFor(() => {
			expect(mockedCreateProposalRequest).toHaveBeenCalledWith({
				orderId: 1,
				price: 10000,
				message:
					"Здравствуйте! Готов обсудить задачу и взять проект в работу.",
				estimatedDays: 14,
			});
		});

		expect(await screen.findByText("Отклик отправлен")).toBeInTheDocument();
		expect(screen.getByText("Ваш отклик")).toBeInTheDocument();
	});

	it("lets owner select freelancer proposal", async () => {
		const user = userEvent.setup();
		mockedAcceptProposalRequest.mockResolvedValue(
			makeOrder({
				status: "Published",
				selectedFreelancerId: 42,
				selectedFreelancerName: "Иван Фрилансер",
				workflowStage: "review",
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
						status: "accepted",
						createdAt: "2026-05-13T00:00:00.000Z",
					},
				],
			}),
		);

		render(
			<ProjectWorkspacePage
				order={makeOrder({
					status: "Published",
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
				onChange={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Выбрать исполнителя" }),
		);

		await waitFor(() => {
			expect(mockedAcceptProposalRequest).toHaveBeenCalledWith(10);
		});

		expect(await screen.findByText("Исполнитель выбран")).toBeInTheDocument();
		expect(screen.getAllByText("Иван Фрилансер").length).toBeGreaterThan(0);
	});

	it("calls delete handler for client-owned deletable order", async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn().mockResolvedValue(undefined);

		render(
			<ProjectWorkspacePage
				order={makeOrder({ canClientDelete: true })}
				canEdit
				onBack={vi.fn()}
				onChange={vi.fn()}
				onDelete={onDelete}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Удалить заказ" }));
		expect(
			screen.getByRole("dialog", { name: "Удалить заказ?" }),
		).toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Подтвердить удаление" }),
		);

		await waitFor(() => {
			expect(onDelete).toHaveBeenCalledWith(1);
		});
	});

	it("disables delete button when order cannot be removed", () => {
		render(
			<ProjectWorkspacePage
				order={makeOrder({ canClientDelete: false, proposalsCount: 1 })}
				canEdit
				onBack={vi.fn()}
				onChange={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Удалить заказ" }),
		).toBeDisabled();
		expect(
			screen.getByText(
				"Удаление доступно только пока у заказа нет откликов, выбранного исполнителя и истории AI-диалогов.",
			),
		).toBeInTheDocument();
	});
});
