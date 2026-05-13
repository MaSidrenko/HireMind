import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { signUpRequest } from "./SignUp";

describe("SignUp api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.clearAllMocks();
	});

	it("sends correct request and returns data on success", async () => {
		const mockResponse = {
			id: 1,
			email: "test@exmaple.com",
			message: "Registered successfully",
		};

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "client" as const,
			contacts: {
				telegram: "@ivan",
				phone: "+79991234567",
			},
			companyName: "My Company",
		};

		const result = await signUpRequest(payload);

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
		expect(url).toEqual(expect.stringContaining("/api/auth/sign-up"));
		expect(init).toMatchObject({
			method: "POST",
			credentials: "include",
			body: JSON.stringify({
				username: payload.fullName,
				fullName: payload.fullName,
				email: payload.email,
				password: payload.password,
				role: payload.role,
				contacts: payload.contacts,
				companyName: payload.companyName,
			}),
		});
		const headers = init?.headers as Headers;
		expect(headers.get("Content-Type")).toBe("application/json");
		expect(headers.get("Accept")).toBe("application/json");

		expect(result).toEqual(mockResponse);
	});

	it("throws server message when response is not ok", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 409,
			text: vi.fn().mockResolvedValue(JSON.stringify({
				message: "Email already exists",
			})),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "client" as const,
			contacts: {},
		};

		await expect(signUpRequest(payload)).rejects.toThrow("Email already exists");
	});

	it("throws default message when response is not ok and json parsing fails", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 500,
			text: vi.fn().mockResolvedValue("Invalid JSON"),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "client" as const,
			contacts: {},
		};

		await expect(signUpRequest(payload)).rejects.toThrow("Ошибка при регистрации");
	});

	it("throws default message when response is not ok and message is missing", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 400,
			text: vi.fn().mockResolvedValue(JSON.stringify({
				error: "Bad request",
			})),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "client" as const,
			contacts: {},
		};

		await expect(signUpRequest(payload)).rejects.toThrow("Ошибка при регистрации");
	});
});
