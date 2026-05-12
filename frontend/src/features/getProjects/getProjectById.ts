const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function getProjectById(projectId: string) {
	const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Get project by id failed");
	}

	return response.json();
}
