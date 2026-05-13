import { ApiError, apiRequest } from "@/shared";
import type { User } from "@/features/Auth/getMe.types";

type Contacts = {
	telegram?: string;
	phone?: string;
};

export type SignUpPayload = {
	fullName: string;
	email: string;
	password: string;
	role: "freelancer" | "client";
	contacts: Contacts;
	companyName?: string;
};

export type AuthResponse = User | { user: User };

export async function signUpRequest(payload: SignUpPayload) {
	try {
		return await apiRequest<AuthResponse>("/api/auth/sign-up", {
			method: "POST",
			body: {
				username: payload.fullName,
				fullName: payload.fullName,
				email: payload.email,
				password: payload.password,
				role: payload.role,
				contacts: payload.contacts,
				companyName: payload.companyName,
			},
		});
	} catch (error) {
		if (
			error instanceof ApiError &&
			error.message !== "Ошибка запроса к серверу" &&
			typeof error.data === "object" &&
			error.data &&
			"message" in error.data
		) {
			throw new Error(error.message);
		}

		throw new Error("Ошибка при регистрации");
	}
}


