import type { User } from "./getMe.types";
import { apiRequest } from "@/shared";

export async function getMe(signal?: AbortSignal): Promise<User | null> {
	try {
		return await apiRequest<User>("/api/auth/me", { method: "GET", signal });
	} catch (error) {
		if (error instanceof Error && error.message.toLowerCase().includes("401")) {
			return null;
		}
		return null;
	}
}
