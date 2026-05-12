export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type ApiOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

async function readResponse(response: Response) {
	const text = await response.text();
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

function getErrorMessage(data: unknown, fallback: string) {
	if (typeof data === "object" && data && "message" in data) {
		const message = (data as { message?: unknown }).message;
		if (typeof message === "string") return message;
	}

	if (typeof data === "string" && data.trim()) return data;
	return fallback;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
	const headers = new Headers(options.headers);
	const hasBody = typeof options.body !== "undefined";

	if (hasBody && !(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	headers.set("Accept", "application/json");

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers,
		credentials: "include",
		body: hasBody
			? options.body instanceof FormData
				? options.body
				: JSON.stringify(options.body)
			: undefined,
	});
	const data = await readResponse(response);

	if (!response.ok) {
		throw new Error(getErrorMessage(data, "Ошибка запроса к серверу"));
	}

	return data as T;
}
