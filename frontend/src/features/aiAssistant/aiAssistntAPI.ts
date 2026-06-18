import { AI_API, apiRequest } from "@/shared";
import type { ProjectOrder } from "../projects/types";
import { normalizeAiBriefResult } from "./normalizeAiBriefResult";
import type { AiBriefResult } from "./types";

export async function generateAiBrief(input: {
	title: string;
	category: string;
	rawDescription: string;
}): Promise<AiBriefResult> {
	const response = await apiRequest<AiBriefResult>(`${AI_API}/briefs/generate`, {
		method: "POST",
		body: input,
	});

	return normalizeAiBriefResult(response);
}

export async function askProjectAi(order: ProjectOrder, prompt: string) {
	const response = await apiRequest<{ answer: string }>(
		`${AI_API}/project-assistant`,
		{
			method: "POST",
			body: { projectId: order.id, prompt },
		},
	);
	return response.answer;
}
