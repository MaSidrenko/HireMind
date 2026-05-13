import { describe, expect, it } from "vitest";
import { formatBudget, formatDate } from "./projectFormatters";

describe("projectFormatters", () => {
	it("formats fixed budget range", () => {
		expect(
			formatBudget({
				budgetMin: 10000,
				budgetMax: 25000,
				currency: "RUB",
				budgetType: "fixed",
			}),
		).toContain("10 000 ₽ - 25 000 ₽");
	});

	it("formats hourly budget range", () => {
		expect(
			formatBudget({
				budgetMin: 50,
				budgetMax: 75,
				currency: "USD",
				budgetType: "hourly",
			}),
		).toContain("/ час");
	});

	it("formats missing and existing publication dates", () => {
		expect(formatDate(null)).toBe("Не опубликован");
		expect(formatDate("2026-05-13T00:00:00.000Z")).toContain("2026");
	});
});
