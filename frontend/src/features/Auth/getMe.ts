import type { User } from "./getMe.types";
import { ApiError, apiRequest } from "@/shared";

export async function getMe(signal?: AbortSignal): Promise<User | null> {
	try {
		return await apiRequest<User>("/api/auth/me", { method: "GET", signal });
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			return null;
		}
		throw new Error("Failed to fetch user");
	}
}
