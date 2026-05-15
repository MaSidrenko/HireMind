// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL = "/api";

type ApiOptions = Omit<RequestInit, "body"> & {
	body?: unknown;
};

export class ApiError extends Error {
	status: number;
	data: unknown;

	constructor(message: string, status: number, data: unknown) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

async function readResponse(response: Response) {
	if (typeof response.text === "function") {
		const text = await response.text();
		if (!text) return null;

		try {
			return JSON.parse(text) as unknown;
		} catch {
			return text;
		}
	}

	try {
		return await response.json();
	} catch {
		return null;
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
	  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const headers = new Headers(options.headers);
	const hasBody = typeof options.body !== "undefined";

	if (hasBody && !(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	headers.set("Accept", "application/json");

	const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
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
		throw new ApiError(
			getErrorMessage(data, "Ошибка запроса к серверу"),
			response.status,
			data,
		);
	}

	return data as T;
}
