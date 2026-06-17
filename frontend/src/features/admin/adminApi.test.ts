import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "@/shared";
import {
	banAdminUserRequest,
	deleteAdminUserRequest,
	requestAdminUserEmailChangeRequest,
	updateAdminOrderRequest,
	updateAdminUserRequest,
	type AdminUserRecord,
} from "./adminApi";
import type { ProjectOrder } from "@/features/projects";

vi.mock("@/shared", () => {
	class TestApiError extends Error {
		status: number;
		data: unknown;

		constructor(message: string, status: number, data: unknown) {
			super(message);
			this.name = "ApiError";
			this.status = status;
			this.data = data;
		}
	}

	return {
		apiRequest: vi.fn(),
		ADMIN_API: "/admin",
		ApiError: TestApiError,
	};
});

vi.mock("@/features/Auth", () => ({
	getMe: vi.fn(),
}));

vi.mock("@/features/freelancers", () => ({
	getFreelancers: vi.fn(),
}));

vi.mock("@/features/projects", () => ({
	getProjects: vi.fn(),
	normalizeProjectOrder: vi.fn((value: unknown) => value),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const userRecord: AdminUserRecord = {
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

const order = {
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
} satisfies ProjectOrder;

describe("adminApi", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("updates a user through admin endpoint", async () => {
		mockedApiRequest.mockResolvedValueOnce({
			user: {
				...userRecord,
				fullName: "Анна Иванова",
				contacts: {
					telegram: "@anna_new",
					phone: "+79990000000",
				},
			},
		});

		await expect(
			updateAdminUserRequest(userRecord, {
				fullName: "Анна Иванова",
				email: " ANNA@EXAMPLE.COM ",
				role: "Client",
				telegram: "@anna_new",
				phone: "+79990000000",
				companyName: "HireMind Studio",
			}),
		).resolves.toEqual(
			expect.objectContaining({
				id: 7,
				fullName: "Анна Иванова",
				email: "anna@example.com",
				pendingEmail: null,
				telegram: "@anna_new",
				phone: "+79990000000",
			}),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/admin/users/7", {
			method: "PUT",
			body: {
				fullName: "Анна Иванова",
				email: "anna@example.com",
				role: "Client",
				contacts: {
					telegram: "@anna_new",
					phone: "+79990000000",
				},
				companyName: "HireMind Studio",
				skills: [],
				hourlyRate: 0,
				currency: "RUB",
			},
		});
	});

	it("requests a confirmed email change for a user", async () => {
		mockedApiRequest.mockResolvedValueOnce({
			message: "На новый email отправлен код подтверждения",
			user: {
				...userRecord,
				pendingEmail: "new@example.com",
				contacts: {
					telegram: userRecord.telegram,
					phone: userRecord.phone,
				},
			},
		});

		await expect(
			requestAdminUserEmailChangeRequest(7, " NEW@EXAMPLE.COM "),
		).resolves.toEqual({
			message: "На новый email отправлен код подтверждения",
			user: expect.objectContaining({
				id: 7,
				email: "anna@example.com",
				pendingEmail: "new@example.com",
			}),
		});

		expect(mockedApiRequest).toHaveBeenCalledWith(
			"/admin/users/7/email-change-request",
			{
				method: "POST",
				body: {
					newEmail: "new@example.com",
				},
			},
		);
	});

	it("sends a direct ban request without local fallback", async () => {
		mockedApiRequest.mockResolvedValueOnce({
			user: {
				...userRecord,
				isBanned: true,
				contacts: {
					telegram: userRecord.telegram,
					phone: userRecord.phone,
				},
			},
		});

		await expect(banAdminUserRequest(7, true)).resolves.toEqual(
			expect.objectContaining({
				id: 7,
				isBanned: true,
			}),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/admin/users/7/ban", {
			method: "PUT",
			body: {
				banned: true,
				isBanned: true,
			},
		});
	});

	it("throws an admin api error when ban endpoint is missing", async () => {
		mockedApiRequest.mockRejectedValueOnce(
			new ApiError("Not found", 404, null),
		);

		await expect(banAdminUserRequest(7, true)).rejects.toMatchObject({
			name: "ApiError",
			message: "Бэкенд ещё не поддерживает бан пользователей из админки.",
			status: 501,
		});
	});

	it("updates an order through admin endpoint", async () => {
		mockedApiRequest.mockResolvedValueOnce({ order });

		await expect(
			updateAdminOrderRequest(order, {
				title: order.title,
				rawDescription: order.rawDescription,
				companyName: order.companyName,
				category: order.category,
				status: order.status,
				budgetMin: order.budgetMin,
				budgetMax: order.budgetMax,
				currency: order.currency,
				budgetType: order.budgetType,
				skills: order.skills,
			}),
		).resolves.toEqual(order);

		expect(mockedApiRequest).toHaveBeenCalledWith("/admin/orders/99", {
			method: "PUT",
			body: expect.objectContaining({
				title: order.title,
				rawDescription: order.rawDescription,
				technicalSpecification: order.technicalSpecification,
				category: "Development",
				budgetMin: order.budgetMin,
				budgetMax: order.budgetMax,
				currency: order.currency,
				budgetType: "Fixed",
				status: "Published",
				skills: order.skills,
				companyName: order.companyName,
			}),
		});

		const requestBody = mockedApiRequest.mock.calls[0]?.[1]?.body as Record<
			string,
			unknown
		>;
		expect(requestBody).not.toHaveProperty("workflowStage");
		expect(requestBody).not.toHaveProperty("aiGenerated");
		expect(requestBody).not.toHaveProperty("readinessScore");
		expect(requestBody).not.toHaveProperty("briefSections");
		expect(requestBody).not.toHaveProperty("clarificationQuestions");
		expect(requestBody).not.toHaveProperty("scopeItems");
		expect(requestBody).not.toHaveProperty("doneCriteria");
		expect(requestBody).not.toHaveProperty("risks");
	});

	it("deletes a user via admin endpoint", async () => {
		mockedApiRequest.mockResolvedValueOnce({
			message: "Пользователь удалён",
		});

		await expect(deleteAdminUserRequest(7)).resolves.toEqual({
			message: "Пользователь удалён",
		});

		expect(mockedApiRequest).toHaveBeenCalledWith("/admin/users/7", {
			method: "DELETE",
		});
	});
});
