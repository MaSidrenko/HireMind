import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutUs from "./AboutUs";

describe("AboutUs", () => {
	it("renders product description and MVP flow", () => {
		render(<AboutUs />);

		expect(
			screen.getByRole("heading", {
				name: "HireMind снижает неопределённость до старта работы",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Сначала ясность")).toBeInTheDocument();
		expect(screen.getByText("От сырой идеи к согласованному брифу")).toBeInTheDocument();
		expect(screen.getByText("Заказчик описывает идею")).toBeInTheDocument();
	});
});
