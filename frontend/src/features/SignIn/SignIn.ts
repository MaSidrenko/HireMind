const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "https://localhost:8080";

type LoginResponse = {
	success: true;
};

export async function SignInRequest(
	login: string,
	password: string,
): Promise<LoginResponse> {
	const response: Response = await fetch(`${API_BASE_URL}/sign-in`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			login: login,
			password: password,
		}),
	});

	if (!response.ok) {
		if (response.status === 401 || response.status === 400) {
			throw new Error("Неверный логин или пароль");
		}

		throw new Error("Не удалось войти. Попробуйте позже");
	}

	return response.json();
}
