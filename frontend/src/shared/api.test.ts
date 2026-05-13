import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, ApiError, apiRequest } from "./api";

describe("apiRequest", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	it("sends JSON body with credentials and default headers", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		await expect(
			apiRequest("/api/test", {
				method: "POST",
				body: { title: "Заказ" },
			}),
		).resolves.toEqual({ ok: true });

		expect(fetch).toHaveBeenCalledWith(
			`${API_BASE_URL}/api/test`,
			expect.objectContaining({
				method: "POST",
				credentials: "include",
				body: JSON.stringify({ title: "Заказ" }),
			}),
		);
		const [, options] = vi.mocked(fetch).mock.calls[0];
		const headers = options?.headers as Headers;
		expect(headers.get("Accept")).toBe("application/json");
		expect(headers.get("Content-Type")).toBe("application/json");
	});

	it("does not stringify FormData body", async () => {
		const formData = new FormData();
		formData.set("file", new Blob(["content"]), "brief.txt");
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ uploaded: true }), { status: 200 }),
		);

		await apiRequest("/api/upload", {
			method: "POST",
			body: formData,
		});

		const [, options] = vi.mocked(fetch).mock.calls[0];
		const headers = options?.headers as Headers;
		expect(options?.body).toBe(formData);
		expect(headers.get("Content-Type")).toBeNull();
	});

	it("returns text response when backend does not send JSON", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response("created", { status: 200 }));

		await expect(apiRequest("/api/plain")).resolves.toBe("created");
	});

	it("returns null for empty successful response", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

		await expect(apiRequest("/api/empty")).resolves.toBeNull();
	});

	it("throws ApiError with server message and status", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ message: "Неверные данные" }), {
				status: 400,
			}),
		);

		await expect(apiRequest("/api/fail")).rejects.toMatchObject({
			name: "ApiError",
			message: "Неверные данные",
			status: 400,
			data: { message: "Неверные данные" },
		} satisfies Partial<ApiError>);
	});
});
