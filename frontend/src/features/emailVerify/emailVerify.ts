import { AUTH_API, ApiError, apiRequest } from "@/shared";

type AuthMessageResponse = {
    message: string;
};

export async function emailVerifyRequest(
    email: string,
    code: string,
): Promise<AuthMessageResponse> {
    try {
        return await apiRequest<AuthMessageResponse>(`${AUTH_API}/email-verify`, {
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
		return await apiRequest<AuthMessageResponse>(`${AUTH_API}/recovery-password`, {
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

export async function verifyPassword(
	email: string,
	code: string,
	newPassword: string,
): Promise<AuthMessageResponse> {
	try {
		return await apiRequest<AuthMessageResponse>(`${AUTH_API}/recovery-password/confirm`, {
			method: "POST",
			body: {
				email: email.trim().toLowerCase(),
				code: code.trim(),
				newPassword,
			},
		});
	} catch (error) {
		if (error instanceof ApiError) {
			throw new Error(
				error.message || "Не удалось сохранить новый пароль",
			);
		}

		throw new Error("Не удалось сохранить новый пароль. Попробуйте позже");
	}
}

export async function confirmEmailChangeRequest(
	email: string,
	code: string,
): Promise<AuthMessageResponse> {
	try {
		return await apiRequest<AuthMessageResponse>(
			`${AUTH_API}/email-change/confirm`,
			{
				method: "POST",
				body: {
					email: email.trim().toLowerCase(),
					code: code.trim(),
				},
			},
		);
	} catch (error) {
		if (error instanceof ApiError) {
			throw new Error(
				error.message || "Не удалось подтвердить новый email",
			);
		}

		throw new Error("Не удалось подтвердить новый email. Попробуйте позже");
	}
}
