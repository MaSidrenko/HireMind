import { AUTH_API, ApiError, apiRequest } from "@/shared";
import type { User } from "@/features/Auth/getMe.types";

export type AuthResponse = User | { user: User };

export async function signInRequest(
	email: string,
	password: string,
): Promise<AuthResponse> {
	try {
		return await apiRequest<AuthResponse>(`${AUTH_API}/sign-in`, {
			method: "POST",
			body: { email: email, password: password },
		});
	} catch (error) {
		if (error instanceof ApiError && [400, 401].includes(error.status)) {
			throw new Error("Неверный логин или пароль");
		}

		throw new Error("Не удалось войти. Попробуйте позже");
	}
}
