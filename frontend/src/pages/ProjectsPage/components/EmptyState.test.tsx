import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
	it("renders optional action", async () => {
		const user = userEvent.setup();
		const onAction = vi.fn();

		render(
			<EmptyState
				title="Ничего нет"
				text="Попробуйте позже."
				action="Повторить"
				onAction={onAction}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Повторить" }));

		expect(screen.getByText("Ничего нет")).toBeInTheDocument();
		expect(onAction).toHaveBeenCalledTimes(1);
	});

	it("does not render action without callback", () => {
		render(<EmptyState title="Пусто" text="Нет данных." action="Повторить" />);

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
