import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Contacts from "./Contacts";

describe("Contacts", () => {
	it("renders diploma project contacts", () => {
		render(<Contacts />);

		expect(
			screen.getByRole("heading", { name: "Связь по продукту и демонстрации" }),
		).toBeInTheDocument();
		expect(screen.getByText("nexon863@gmail.com")).toBeInTheDocument();
		expect(screen.getByText("@dark_soulBattle")).toBeInTheDocument();
		expect(screen.getByLabelText("Открыть GitHub репозиторий")).toHaveAttribute(
			"href",
			"https://github.com/MaSidrenko/HireMind/tree/develop",
		);
	});
});
