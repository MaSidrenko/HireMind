const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type Contacts = {
	telegram?: string;
	phone?: string;
};

type SignUpPayload = {
	fullName: string;
	email: string;
	password: string;
	role: string;
	contacts: Contacts;
	companyName?: string;
};

export async function SignUp(payload: SignUpPayload) {
	const response = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({
			username: payload.fullName,
			email: payload.email,
			password: payload.password,
			role: payload.role,
			contacts: payload.contacts,
			companyName: payload.companyName,
		}),
	});
	let data = null;

	try {
		data = await response.json();
	} catch {
		data = null;
	}

	if (!response.ok) {
		const message =
			typeof data === "object" &&
			data != null &&
			"message" in data &&
			typeof(data as { message?: unknown }).message === "string"
				? (data as { message: string }).message
				: "Ошибка при регистрации";

		throw new Error(message);
	}

	return data;
}
