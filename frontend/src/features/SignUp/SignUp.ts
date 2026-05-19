import { ApiError, apiRequest } from "@/shared";

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

type SignUpResponse = {
    message: string;
};

export async function signUpRequest(
    payload: SignUpPayload,
): Promise<SignUpResponse> {
    try {
        return await apiRequest<SignUpResponse>("/auth/sign-up", {
            method: "POST",
            body: {
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