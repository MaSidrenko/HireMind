import { apiRequest } from "@/shared";
import { normalizeProjectOrder } from "./projectLogic";
import type { CreateProjectInput, ProjectOrder } from "./types";

export async function getProjects() {
	const projects = await apiRequest<Partial<ProjectOrder>[]>("Order/get-all");
	return projects.map(normalizeProjectOrder);
}

export async function getAcceptedProject() {
	const projects = await apiRequest<Partial<ProjectOrder>[]>("Order/get-accepted-projects");
	return projects.map(normalizeProjectOrder);
}

export async function getProjectById(id: number) {
	const project = await apiRequest<Partial<ProjectOrder>>(
		`/Order/get-by-id/${id}`,
	);
	return normalizeProjectOrder(project);
}

const categoryToBackend = {
	"Разработка": "Development",
	"Дизайн": "Design",
	"Маркетинг": "Marketing",
	"Контент": "Content",
} as const;

const paymentToBackend = {
	fixed: "Fixed",
	hourly: "Hourly",
} as const;

export async function createProjectRequest(input: CreateProjectInput) {
	const project = await apiRequest<Partial<ProjectOrder>>("/Order/create", {
		method: "POST",
		body: {
			title: input.title,
			rawDescription: input.rawDescription,
			technicalSpecification: input.aiSummary,
			category: categoryToBackend[input.category as keyof typeof categoryToBackend],
			budgetMin: input.minPrice,
			budgetMax: input.maxPrice,
			currency: input.currency,
			budgetType: paymentToBackend[input.payment],
			skills: input.skills,
			aiGenerated: Boolean(input.aiSummary || input.briefSections),
			readinessScore: 0,
			briefSections: input.briefSections,
			clarificationQuestions: input.clarificationQuestions,
			risks: input.risks,
			companyName: input.companyName,
		},
	});

	return normalizeProjectOrder(project);
}

// const categoryToBackend = {
// 	"Разработка": "Development",
// 	"Дизайн": "Design",
// 	"Маркетинг": "Marketing",
// 	"Контент": "Content",
// } as const;

// const paymentToBackend = {
// 	fixed: "Fixed",
// 	hourly: "Hourly",
// } as const;

const statusToBackend: Record<string, string> = {
	draft: "Draft",
	published: "Published",
	paused: "Paused",
	in_progress: "In_Progress",
	completed: "Completed",
	archived: "Archived",

	Draft: "Draft",
	Published: "Published",
	Paused: "Paused",
	InProgress: "In_Progress",
	Completed: "Completed",
	Archived: "Archived",
};

export async function updateProjectRequest(project: ProjectOrder) {
	const body = {
		title: project.title,
		rawDescription: project.rawDescription,
		technicalSpecification: project.technicalSpecification,

		category:
			categoryToBackend[project.category as keyof typeof categoryToBackend] ??
			project.category,

		budgetMin: project.budgetMin,
		budgetMax: project.budgetMax,

		currency: project.currency,

		budgetType:
			paymentToBackend[project.budgetType as keyof typeof paymentToBackend] ??
			project.budgetType,

		status: statusToBackend[String(project.status)] ?? project.status,
		workflowStage: project.workflowStage,

		skills: project.skills,

		aiGenerated: project.aiGenerated,
		readinessScore: project.readinessScore,

		briefSections: project.briefSections,
		clarificationQuestions: project.clarificationQuestions,
		scopeItems: project.scopeItems,
		doneCriteria: project.doneCriteria,
		risks: project.risks,
		approvals: project.approvals,

		companyName: project.companyName,
	};

	const nextProject = await apiRequest<Partial<ProjectOrder>>(
		`/Order/update/${project.id}`,
		{
			method: "PUT",
			body,
		},
	);

	return normalizeProjectOrder(nextProject);
}


export type CreateProposalInput = {
	orderId: number;
	price: number;
	message: string;
	estimatedDays: number;
};

export async function createProposalRequest(input: CreateProposalInput) {
	const result = await apiRequest<Partial<ProjectOrder>>(
		"/Order/Proposal/create",
		{
			method: "PUT",
			body: {
				orderId: input.orderId,
				price: input.price,
				message: input.message,
				estimatedDays: input.estimatedDays,
			},
		},
	);

	return normalizeProjectOrder(result);
}

export async function acceptProposalRequest(proposalId: number) {
	const result = await apiRequest<Partial<ProjectOrder>>(
		`/Order/Proposal/${proposalId}/accept`,
		{
			method: "PUT",
		},
	);

	return normalizeProjectOrder(result);
}

export async function withdrawProposalRequest(proposalId: number) {
	const result = await apiRequest<Partial<ProjectOrder>>(
		`/Order/Proposal/${proposalId}/withdraw`,
		{
			method: "PUT",
		},
	);

	return normalizeProjectOrder(result);
}

export async function updateOrderApprovalRequest(
	orderId: number,
	side: "client" | "freelancer",
	approved: boolean,
) {
	const result = await apiRequest<Partial<ProjectOrder>>(
		`/Order/${orderId}/approval/${side}`,
		{
			method: "PUT",
			body: { approved },
		},
	);

	return normalizeProjectOrder(result);
}

export async function rateOrderRequest(orderId: number, score: number) {
	const result = await apiRequest<Partial<ProjectOrder>>(
		`/Order/${orderId}/rating`,
		{
			method: "PUT",
			body: { score },
		},
	);

	return normalizeProjectOrder(result);
}
