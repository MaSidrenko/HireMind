import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SignInRequest } from "./SignIn";

describe("SignIn api", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.clearAllMocks();
	});

	it("sends correct request and returns correct response", async () => {
		const mockResponse = {
			success: true,
		};

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(mockResponse),
		} as unknown as Response);

		const result = await SignInRequest("test@test.com", "123456Qw!");

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/sign-in"),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					login: "test@test.com",
					password: "123456Qw!",
				}),
			},
		);

		expect(result).toEqual(mockResponse);
	});

	it("throws server message when response is not ok", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 500,
			json: vi.fn(),
		} as unknown as Response);

		await expect(
			SignInRequest("test@test.com", "123456Qw!"),
		).rejects.toThrow("Не удалось войти. Попробуйте позже");
	});

	it("throws auth error when status is 400", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 400,
			json: vi.fn(),
		} as unknown as Response);

		await expect(
			SignInRequest("test@test.com", "123456Qw!"),
		).rejects.toThrow("Неверный логин или пароль");
	});
});
