import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../shared";
import type { CreateProjectInput, ProjectOrder } from "./types";
import {
	createProjectRequest,
	deleteProjectRequest,
	getProjectById,
	getProjects,
	updateProjectRequest,
} from "./projectsApi";

vi.mock("@/shared", () => ({
	apiRequest: vi.fn(),
	ORDER_API: "/order",
}));

const mockedApiRequest = vi.mocked(apiRequest);

const createInput: CreateProjectInput = {
	hirerId: 7,
	hirerName: "Анна Заказчик",
	title: "Лендинг",
	companyName: "HireMind",
	category: "Разработка",
	rawDescription: "Нужно сделать понятный лендинг для дипломного проекта.",
	minPrice: 10000,
	maxPrice: 25000,
	currency: "RUB",
	payment: "fixed",
	skills: ["React", "CSS"],
};

const project = {
	id: 99,
	hirerId: createInput.hirerId,
	hirerName: createInput.hirerName,
	companyName: createInput.companyName,
	category: createInput.category,
	rawDescription: createInput.rawDescription,
	budgetMin: createInput.minPrice,
	budgetMax: createInput.maxPrice,
	currency: createInput.currency,
	budgetType: createInput.payment,
	skills: createInput.skills,
	selectedFreelancerId: null,
	selectedFreelancerName: null,
	shortDescription: createInput.rawDescription,
	technicalSpecification: "",
	status: "Draft",
	workflowStage: "brief",
	proposalsCount: 0,
	proposals: [],
	publishedAt: null,
	completedAt: null,
	updatedAt: "2026-05-13T00:00:00.000Z",
	aiGenerated: true,
	readinessScore: 50,
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
	hirerRating: 0,
	selectedFreelancerRating: null,
	clientRatingByFreelancer: null,
	freelancerRatingByClient: null,
	approvals: {
		client: false,
		freelancer: false,
		clientDone: false,
		freelancerDone: false,
	},
	canClientDelete: true,
} satisfies ProjectOrder;

describe("projectsApi", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("loads projects", async () => {
		mockedApiRequest.mockResolvedValueOnce([project]);

		await expect(getProjects()).resolves.toEqual([
			expect.objectContaining({ id: 99, status: "Draft", readinessScore: 0 }),
		]);

		expect(mockedApiRequest).toHaveBeenCalledWith("/order/get-all");
	});

	it("loads one project by id", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(getProjectById(99)).resolves.toEqual(
			expect.objectContaining({ id: 99, status: "Draft", readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/order/get-by-id/99");
	});

	it("creates project with POST body", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(createProjectRequest(createInput)).resolves.toEqual(
			expect.objectContaining({ id: 99, status: "Draft", readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			"/order/create",
			expect.objectContaining({
				method: "POST",
				body: expect.objectContaining({
					title: createInput.title,
					rawDescription: createInput.rawDescription,
					category: "Development",
					budgetMin: createInput.minPrice,
					budgetMax: createInput.maxPrice,
					currency: createInput.currency,
					budgetType: "Fixed",
					skills: createInput.skills,
					aiGenerated: false,
					readinessScore: 0,
				}),
			}),
		);
	});

	it("updates project by id", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(updateProjectRequest(project)).resolves.toEqual(
			expect.objectContaining({ id: 99, status: "Draft", readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			"/order/update/99",
			expect.objectContaining({
				method: "PUT",
				body: expect.objectContaining({
					title: project.title,
					rawDescription: project.rawDescription,
					technicalSpecification: project.technicalSpecification,
					category: "Development",
					budgetMin: project.budgetMin,
					budgetMax: project.budgetMax,
					currency: project.currency,
					budgetType: "Fixed",
					status: "Draft",
					workflowStage: project.workflowStage,
					skills: project.skills,
					aiGenerated: project.aiGenerated,
					readinessScore: project.readinessScore,
				}),
			}),
		);
	});

	it("deletes project by id", async () => {
		mockedApiRequest.mockResolvedValueOnce(null);

		await expect(deleteProjectRequest(99)).resolves.toBeUndefined();

		expect(mockedApiRequest).toHaveBeenCalledWith("/order/order/99", {
			method: "DELETE",
		});
	});
});
