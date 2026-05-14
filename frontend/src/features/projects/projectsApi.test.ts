import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../shared";
import type { CreateProjectInput, ProjectOrder } from "./types";
import {
	createProjectRequest,
	getProjectById,
	getProjects,
	updateProjectRequest,
} from "./projectsApi";

vi.mock("@/shared", () => ({
	apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const createInput: CreateProjectInput = {
	hirerId: 7,
	hirerName: "Анна Заказчик",
	title: "Лендинг",
	companyName: "HireMind",
	category: "Веб-разработка",
	rawDescription: "Нужно сделать понятный лендинг для дипломного проекта.",
	budgetMin: 10000,
	budgetMax: 25000,
	currency: "RUB",
	budgetType: "fixed",
	skills: ["React", "CSS"],
};

const project = {
	id: 99,
	...createInput,
	selectedFreelancerId: null,
	selectedFreelancerName: null,
	shortDescription: createInput.rawDescription,
	technicalSpecification: "",
	status: "draft",
	workflowStage: "brief",
	proposalsCount: 0,
	proposals: [],
	publishedAt: null,
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
	approvals: { client: false, freelancer: false },
} satisfies ProjectOrder;

describe("projectsApi", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("loads projects", async () => {
		mockedApiRequest.mockResolvedValueOnce([project]);

		await expect(getProjects()).resolves.toEqual([
			expect.objectContaining({ id: 99, readinessScore: 0 }),
		]);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/projects");
	});

	it("loads one project by id", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(getProjectById(99)).resolves.toEqual(
			expect.objectContaining({ id: 99, readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/projects/99");
	});

	it("creates project with POST body", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(createProjectRequest(createInput)).resolves.toEqual(
			expect.objectContaining({ id: 99, readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/projects", {
			method: "POST",
			body: createInput,
		});
	});

	it("updates project by id", async () => {
		mockedApiRequest.mockResolvedValueOnce(project);

		await expect(updateProjectRequest(project)).resolves.toEqual(
			expect.objectContaining({ id: 99, readinessScore: 0 }),
		);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/projects/99", {
			method: "PUT",
			body: project,
		});
	});
});
