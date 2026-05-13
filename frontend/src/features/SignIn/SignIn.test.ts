import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { signInRequest } from "./SignIn";

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
			id: 1,
			email: "test@test.com",
			fullName: "Test User",
			role: "freelancer",
			contacts: {
				telegram: "@test",
			},
			isOnline: true,
			skills: [],
		};

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: true,
			status: 200,
			text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
		} as unknown as Response);

		const result = await signInRequest("test@test.com", "123456Qw!");

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
		expect(url).toEqual(expect.stringContaining("/api/auth/sign-in"));
		expect(init).toMatchObject({
			method: "POST",
			credentials: "include",
			body: JSON.stringify({
				login: "test@test.com",
				password: "123456Qw!",
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
			status: 500,
			text: vi.fn().mockResolvedValue(""),
		} as unknown as Response);

		await expect(
			signInRequest("test@test.com", "123456Qw!"),
		).rejects.toThrow("Не удалось войти. Попробуйте позже");
	});

	it("throws auth error when status is 400", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 400,
			text: vi.fn().mockResolvedValue(""),
		} as unknown as Response);

		await expect(
			signInRequest("test@test.com", "123456Qw!"),
		).rejects.toThrow("Неверный логин или пароль");
	});
});
