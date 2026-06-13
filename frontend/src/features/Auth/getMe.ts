import type { User } from "./getMe.types";
import { AUTH_API, ApiError, apiRequest } from "@/shared";

type MeResponse = {
	user: User;
};

export async function getMe(signal?: AbortSignal): Promise<User | null> {
	try {
		const response = await apiRequest<MeResponse>(`${AUTH_API}/me`, {
			method: "GET",
			signal,
		});
		return response.user;
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			return null;
		}
		throw new Error("Failed to fetch user");
	}
}
