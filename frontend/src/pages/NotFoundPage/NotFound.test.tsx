import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import NotFound from "./NotFound";

describe("NotFound", () => {
	it("renders 404 page links", () => {
		render(
			<MemoryRouter>
				<NotFound />
			</MemoryRouter>,
		);

		expect(
			screen.getByRole("heading", { name: "Страница не найдена" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "На главную" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByRole("link", { name: "К заказам" })).toHaveAttribute(
			"href",
			"/projects",
		);
	});
});
