import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PageState from "./PageState";

describe("PageState", () => {
	it("renders loading state", () => {
		render(
			<PageState
				variant="loading"
				title="Загружаем заказы"
				text="Получаем список проектов с сервера."
			/>,
		);

		expect(screen.getByText("Загружаем заказы")).toBeInTheDocument();
		expect(
			screen.getByText("Получаем список проектов с сервера."),
		).toBeInTheDocument();
	});

	it("calls action handler", async () => {
		const user = userEvent.setup();
		const onAction = vi.fn();

		render(
			<PageState
				title="Заказы не найдены"
				action="Сбросить"
				onAction={onAction}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Сбросить" }));

		expect(onAction).toHaveBeenCalledTimes(1);
	});
});
