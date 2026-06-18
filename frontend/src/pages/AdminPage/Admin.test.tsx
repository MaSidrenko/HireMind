import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Admin from "./Admin";
import {
	getAdminOrders,
	getAdminUsers,
	requestAdminUserEmailChangeRequest,
	updateAdminUserRequest,
	useAuth,
} from "@/features";

vi.mock("@/features", () => ({
	banAdminUserRequest: vi.fn(),
	deleteAdminOrderRequest: vi.fn(),
	deleteAdminUserRequest: vi.fn(),
	formatBudget: vi.fn(() => "10 000 - 25 000 RUB"),
	getAdminOrders: vi.fn(),
	getAdminUsers: vi.fn(),
	promoteUserToAdminRequest: vi.fn(),
	requestAdminUserEmailChangeRequest: vi.fn(),
	statusLabels: {
		Draft: "Черновик",
		Published: "Опубликован",
		Paused: "На паузе",
		In_Progress: "В работе",
		Completed: "Завершён",
		Cancelled: "Отменён",
		Archived: "Архив",
	},
	updateAdminOrderRequest: vi.fn(),
	updateAdminUserRequest: vi.fn(),
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetAdminUsers = vi.mocked(getAdminUsers);
const mockedGetAdminOrders = vi.mocked(getAdminOrders);
const mockedRequestAdminUserEmailChangeRequest = vi.mocked(
	requestAdminUserEmailChangeRequest,
);
const mockedUpdateAdminUserRequest = vi.mocked(updateAdminUserRequest);

const adminUser = {
	id: 1,
	fullName: "Супер Админ",
	email: "admin@example.com",
	role: "Admin",
	isOnline: true,
	contacts: {
		telegram: "@admin",
		phone: "+79991112233",
	},
	rating: 5,
	skills: ["Management"],
	hourlyRate: 0,
	currency: "RUB",
	completedOrders: 0,
};

const managedUser = {
	id: 7,
	fullName: "Анна Смирнова",
	role: "Client",
	email: "anna@example.com",
	pendingEmail: null,
	companyName: "HireMind",
	telegram: "@anna",
	phone: "+79990001122",
	contacts: ["@anna", "+79990001122"],
	rating: 4.7,
	isOnline: true,
	isBanned: false,
	skills: [],
	hourlyRate: null,
	currency: null,
	completedOrders: null,
};

const managedOrder = {
	id: 99,
	hirerId: 7,
	hirerName: "Анна Смирнова",
	hirerRating: 4.7,
	selectedFreelancerId: null,
	selectedFreelancerName: null,
	selectedFreelancerRating: null,
	title: "Новый лендинг",
	shortDescription: "Короткое описание",
	rawDescription: "Нужно обновить лендинг и форму заявки.",
	technicalSpecification: "TS",
	status: "Published",
	workflowStage: "brief",
	category: "Разработка",
	budgetMin: 10000,
	budgetMax: 25000,
	currency: "RUB",
	budgetType: "fixed",
	skills: ["React", "TypeScript"],
	proposalsCount: 2,
	proposals: [],
	publishedAt: null,
	completedAt: null,
	updatedAt: "2026-06-15T10:00:00.000Z",
	companyName: "HireMind",
	aiGenerated: false,
	readinessScore: 0,
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
	clarificationQuestions: [],
	scopeItems: [],
	doneCriteria: [],
	risks: [],
	approvals: {
		client: false,
		freelancer: false,
		clientDone: false,
		freelancerDone: false,
	},
	clientRatingByFreelancer: null,
	freelancerRatingByClient: null,
};

function renderAdmin() {
	return render(
		<MemoryRouter>
			<Admin />
		</MemoryRouter>,
	);
}

describe("Admin page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseAuth.mockReturnValue({
			user: adminUser,
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
			refreshAuth: vi.fn(),
			replaceUser: vi.fn(),
			isAuthenticated: true,
			loading: false,
		} as ReturnType<typeof useAuth>);
		mockedGetAdminUsers.mockResolvedValue([managedUser]);
		mockedGetAdminOrders.mockResolvedValue([managedOrder]);
		mockedRequestAdminUserEmailChangeRequest.mockResolvedValue({
			message: "На новый email отправлен код подтверждения",
			user: {
				...managedUser,
				pendingEmail: "new@example.com",
			},
		});
		mockedUpdateAdminUserRequest.mockResolvedValue({
			...managedUser,
			fullName: "Анна Иванова",
		});
	});

	it("switches between users and orders workspaces", async () => {
		const user = userEvent.setup();

		renderAdmin();

		await waitFor(() => {
			expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
		});

		expect(
			screen.getByText(
				"Редактирование основных полей, бан, удаление и выдача административных прав.",
			),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Заказы" }));

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /Новый лендинг/i }),
			).toBeInTheDocument();
		});

		expect(
			screen.getByText(
				"Редактирование основных полей проекта и быстрое удаление без перехода в карточку заказа.",
			),
		).toBeInTheDocument();
	});

	it("saves edited user through admin request", async () => {
		const user = userEvent.setup();

		renderAdmin();

		const nameInput = await screen.findByLabelText("Имя");

		await user.clear(nameInput);
		await user.type(nameInput, "Анна Иванова");
		await user.click(
			screen.getByRole("button", { name: "Сохранить пользователя" }),
		);

		await waitFor(() => {
			expect(mockedUpdateAdminUserRequest).toHaveBeenCalledWith(
				managedUser,
				expect.objectContaining({
					fullName: "Анна Иванова",
					email: "anna@example.com",
					role: "Client",
				}),
			);
		});
	});

	it("starts email confirmation flow when admin changes user email", async () => {
		const user = userEvent.setup();

		renderAdmin();

		const emailInput = await screen.findByLabelText("Email");

		await user.clear(emailInput);
		await user.type(emailInput, "new@example.com");
		await user.click(
			screen.getByRole("button", { name: "Сохранить пользователя" }),
		);

		await waitFor(() => {
			expect(mockedUpdateAdminUserRequest).toHaveBeenCalledWith(
				managedUser,
				expect.objectContaining({
					email: "anna@example.com",
				}),
			);
			expect(mockedRequestAdminUserEmailChangeRequest).toHaveBeenCalledWith(
				7,
				"new@example.com",
			);
		});

		expect(
			await screen.findByText("На новый email отправлен код подтверждения"),
		).toBeInTheDocument();
	});
});
