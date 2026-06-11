import { PROFILE_API, apiRequest } from "@/shared";

export async function updateProfileSkills(skills: string[]) {
	return apiRequest<unknown>(`${PROFILE_API}/skills`, {
		method: "PATCH",
		body: { skills },
	});
}
