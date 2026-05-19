import { ApiError, apiRequest } from "@/shared";

type EmailVerifyResponse = {
    message: string;
};

export async function emailVerifyRequest(
    email: string,
    code: string,
): Promise<EmailVerifyResponse> {
    try {
        return await apiRequest<EmailVerifyResponse>("/auth/email-verify", {
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