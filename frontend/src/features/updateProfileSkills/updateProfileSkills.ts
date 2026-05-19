import { apiRequest } from "@/shared";

export async function updateProfileSkills(skills: string[]) {
	return apiRequest<unknown>("/profile/skills", {
		method: "PATCH",
		body: { skills },
	});
}
