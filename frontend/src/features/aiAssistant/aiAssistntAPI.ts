import { apiRequest } from "@/shared";
import type { ProjectOrder } from "../projects/types";
import type { AiBriefResult } from "./types";

export async function generateAiBrief(input: {
	title: string;
	category: string;
	rawDescription: string;
}): Promise<AiBriefResult> {
	return apiRequest<AiBriefResult>("/Ai/briefs/generate", {
		method: "POST",
		body: input,
	});
}

export async function askProjectAi(order: ProjectOrder, prompt: string) {
	const response = await apiRequest<{ answer: string }>("/Ai/project-assistant", {
		method: "POST",
		body: { projectId: order.id, prompt },
	});
	return response.answer;
}
