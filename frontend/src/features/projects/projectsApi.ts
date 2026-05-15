import { apiRequest } from "@/shared";
import { normalizeProjectOrder } from "./projectLogic";
import type { CreateProjectInput, ProjectOrder } from "./types";

export async function getProjects() {
	const projects = await apiRequest<Partial<ProjectOrder>[]>("/projects");
	return projects.map(normalizeProjectOrder);
}

export async function getProjectById(id: number) {
	const project = await apiRequest<Partial<ProjectOrder>>(`/projects/${id}`);
	return normalizeProjectOrder(project);
}

export async function createProjectRequest(input: CreateProjectInput) {
	const project = await apiRequest<Partial<ProjectOrder>>("/projects", {
		method: "POST",
		body: input,
	});
	return normalizeProjectOrder({
		hirerId: input.hirerId,
		hirerName: input.hirerName,
		title: input.title,
		shortDescription: input.rawDescription.slice(0, 150),
		rawDescription: input.rawDescription,
		technicalSpecification: input.aiSummary,
		category: input.category,
		budgetMin: input.budgetMin,
		budgetMax: input.budgetMax,
		currency: input.currency,
		budgetType: input.budgetType,
		skills: input.skills,
		companyName: input.companyName,
		aiGenerated: Boolean(input.aiSummary || input.briefSections),
		briefSections: input.briefSections,
		clarificationQuestions: input.clarificationQuestions,
		risks: input.risks,
		...project,
	});
}

export async function updateProjectRequest(project: ProjectOrder) {
	const nextProject = await apiRequest<Partial<ProjectOrder>>(`/projects/${project.id}`, {
		method: "PUT",
		body: project,
	});
	return normalizeProjectOrder(nextProject);
}
