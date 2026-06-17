export const API_BASE_URL = (
	import.meta.env.VITE_API_BASE_URL || "/api/v1"
).replace(/\/+$/, "");

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
		if (typeof message === "string" && message.trim()) return message;
	}

	if (typeof data === "object" && data && "detail" in data) {
		const detail = (data as { detail?: unknown }).detail;
		if (typeof detail === "string" && detail.trim()) return detail;
	}

	if (typeof data === "object" && data && "errors" in data) {
		const errors = (data as { errors?: unknown }).errors;
		if (typeof errors === "object" && errors !== null) {
			for (const value of Object.values(errors)) {
				if (typeof value === "string" && value.trim()) {
					return value;
				}

				if (Array.isArray(value)) {
					const firstMessage = value.find(
						(item): item is string =>
							typeof item === "string" && item.trim().length > 0,
					);

					if (firstMessage) {
						return firstMessage;
					}
				}
			}
		}
	}

	if (typeof data === "object" && data && "title" in data) {
		const title = (data as { title?: unknown }).title;
		if (typeof title === "string" && title.trim()) return title;
	}

	if (typeof data === "string" && data.trim()) return data;
	return fallback;
}

export async function apiRequest<T>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
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
		console.log("API ERROR:", {
			url: `${API_BASE_URL}${normalizedPath}`,
			status: response.status,
			requestBody: options.body,
			responseData: data,
		});

		if (typeof data === "object" && data !== null && "errors" in data) {
			console.log(
				"VALIDATION ERRORS:",
				JSON.stringify((data as { errors: unknown }).errors, null, 2),
			);
		}
		throw new ApiError(
			getErrorMessage(data, "Ошибка запроса к серверу"),
			response.status,
			data,
		);
	}

	return data as T;
}
