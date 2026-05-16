import { ApiError, apiRequest } from "@/shared";

type EmailVerifyResponse = {
	message: string;
};

export async function emailVerifyRequest(
	code: string
): Promise<EmailVerifyResponse> {
	try {
		return await apiRequest<EmailVerifyResponse>("/api/auth/email-verify", {
			method: "POST",
			body: {
				emailCode: code,
			},
		});
	} catch (error) {
		if (error instanceof ApiError && [400, 401].includes(error.status)) {
			throw new Error("Неверный код подтверждения");
		}

		throw new Error("Не удалось проверить код. Попробуйте позже");
	}
}