const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "https://localhost:8080";

export async function updateProfileSkills(skills:string[]) {
	const response = await fetch(`${API_BASE_URL}/profile/skills`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			skills,
		}),
	});

	if(!response.ok) {
		throw new Error("Failed to update profile skills");
		
	}

	return response.json();
}