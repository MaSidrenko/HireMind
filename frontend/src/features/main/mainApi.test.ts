import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/shared";
import {
	getCategoryProjectCount,
	getCategoryProjectCounts,
	getUserCount,
} from "./mainApi";

vi.mock("@/shared", () => ({
	apiRequest: vi.fn(),
	MAIN_API: "/main",
}));

const mockedApiRequest = vi.mocked(apiRequest);

describe("mainApi", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("loads total users count", async () => {
		mockedApiRequest.mockResolvedValueOnce(321);

		await expect(getUserCount()).resolves.toBe(321);

		expect(mockedApiRequest).toHaveBeenCalledWith("/main/user-count");
	});

	it("maps display category to backend category for single count request", async () => {
		mockedApiRequest.mockResolvedValueOnce(14);

		await expect(getCategoryProjectCount("Копирайтинг")).resolves.toBe(14);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			"/main/project-type-count?category=Content",
		);
	});

	it("reuses backend counts for duplicated landing categories", async () => {
		mockedApiRequest
			.mockResolvedValueOnce(25)
			.mockResolvedValueOnce(8)
			.mockResolvedValueOnce(6)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(11);

		await expect(
			getCategoryProjectCounts([
				"Веб-разработка",
				"Дизайн",
				"Копирайтинг",
				"Мобильная разработка",
				"Маркетинг",
			]),
			).resolves.toEqual({
				"Веб-разработка": 25,
				"Дизайн": 8,
				"Копирайтинг": 6,
				"Мобильная разработка": 4,
				"Маркетинг": 11,
			});

		expect(mockedApiRequest).toHaveBeenCalledTimes(5);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			1,
			"/main/project-type-count?category=Development",
		);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			2,
			"/main/project-type-count?category=Design",
		);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			3,
			"/main/project-type-count?category=Content",
		);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			4,
			"/main/project-type-count?category=MobileDevelopment",
		);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			5,
			"/main/project-type-count?category=Marketing",
		);
	});
});
