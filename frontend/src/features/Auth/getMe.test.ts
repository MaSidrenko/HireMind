import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMe } from "./getMe";

describe("getMe", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		globalThis.fetch = vi.fn();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.clearAllMocks();
	});

	it("returns user when response is ok", async () => {
		const mockUser = {
			id: 1,
			email: "test@example.com",
			fullName: "Иван Иванов",
			role: "customer",
		};

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue(mockUser),
		} as unknown as Response);

		const result = await getMe();

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/auth/me"),
			{
				method: "GET",
				credentials: "include",
				signal: undefined,
			},
		);
		expect(result).toEqual(mockUser);
	});

	it("returns null when response status is 401", async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 401,
			json: vi.fn(),
		} as unknown as Response);

		const result = await getMe();

		expect(result).toBeNull();
	});

	it('throws error when response is not ok and status is not 401', async () => {
		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 500,
			json: vi.fn(),
		} as unknown as Response);

		await expect(getMe()).rejects.toThrow("Failed to fetch user");
	});

	it("passes abort signal to fetch", async () => {
		const controller = new AbortController();

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: false,
			status: 401,
			json: vi.fn(),
		} as unknown as Response);

		await getMe(controller.signal);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/auth/me"),
			{
				method: "GET",
				credentials: "include",
				signal: controller.signal,
			},
		);
	});
});