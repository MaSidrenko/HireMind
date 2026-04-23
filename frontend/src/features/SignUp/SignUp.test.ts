import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SignUp } from "./SignUp";

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
			json: vi.fn().mockResolvedValue(mockResponse),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "customer",
			contacts: {
				telegram: "@ivan",
				phone: "+79991234567",
			},
			companyName: "My Company",
		};

		const result = await SignUp(payload);

		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/auth/sign-up"),
			{
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
			},
		);

		expect(result).toEqual(mockResponse);
	});

	it("throws server message when response is not ok", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			json: vi.fn().mockResolvedValue({
				message: "Email already exists",
			}),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "customer",
			contacts: {},
		};

		await expect(SignUp(payload)).rejects.toThrow("Email already exists");
	});

	it("throws default message when response is not ok and json parsing fails", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "customer",
			contacts: {},
		};

		await expect(SignUp(payload)).rejects.toThrow("Ошибка при регистрации");
	});

	it("throws default message when response is not ok and message is missing", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			json: vi.fn().mockResolvedValue({
				error: "Bad request",
			}),
		} as unknown as Response);

		const payload = {
			fullName: "Иван Иванов",
			email: "test@example.com",
			password: "123456",
			role: "customer",
			contacts: {},
		};

		await expect(SignUp(payload)).rejects.toThrow("Ошибка при регистрации");
	});
});
