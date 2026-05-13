import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageBadge, StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
	it("renders order status label", () => {
		render(<StatusBadge status="published" />);

		expect(screen.getByText("Опубликован")).toHaveClass("hm-badge--published");
	});

	it("renders workflow stage label", () => {
		render(<StageBadge stage="brief" />);

		expect(screen.getByText("Бриф")).toHaveClass("hm-badge--stage");
	});
});
