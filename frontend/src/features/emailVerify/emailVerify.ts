import { ApiError, apiRequest } from "@/shared";

type AuthMessageResponse = {
    message: string;
};

export async function emailVerifyRequest(
    email: string,
    code: string,
): Promise<AuthMessageResponse> {
    try {
        return await apiRequest<AuthMessageResponse>("/auth/email-verify", {
            method: "POST",
            body: {
                email: email.trim().toLowerCase(),
                code: code.trim(),
            },
        });
    } catch (error) {
        if (error instanceof ApiError) {
            console.log("VERIFY ERROR DATA:", error.data);
            throw new Error(
                typeof error.data === "string"
                    ? error.data
                    : "Не удалось подтвердить email",
            );
        }

        throw new Error("Не удалось проверить код. Попробуйте позже");
    }
}

export async function resetPasswordRequest(
	email: string,
): Promise<AuthMessageResponse> {
	try {
		return await apiRequest<AuthMessageResponse>("/auth/recovery-password", {
			method: "POST",
			body: {
				email: email.trim().toLowerCase(),
			},
		});
	} catch (error) {
		if (error instanceof ApiError) {
			throw new Error(
				typeof error.data === "string"
					? error.data
					: error.message || "Не удалось отправить код восстановления",
			);
		}

		throw new Error("Не удалось отправить код. Попробуйте позже");
	}
}	
