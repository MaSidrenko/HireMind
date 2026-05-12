import { apiRequest } from "@/shared";
import type { CreateProjectInput, ProjectOrder } from "./types";

export async function getProjects() {
	return apiRequest<ProjectOrder[]>("/api/projects");
}

export async function createProjectRequest(input: CreateProjectInput) {
	return apiRequest<ProjectOrder>("/api/projects", {
		method: "POST",
		body: input,
	});
}

export async function updateProjectRequest(project: ProjectOrder) {
	return apiRequest<ProjectOrder>(`/api/projects/${project.id}`, {
		method: "PUT",
		body: project,
	});
}
