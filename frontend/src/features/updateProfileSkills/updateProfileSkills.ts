import { apiRequest } from "@/shared";

export async function updateProfileSkills(skills: string[]) {
	return apiRequest<unknown>("/api/profile/skills", {
		method: "PATCH",
		body: { skills },
	});
}
