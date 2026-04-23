import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ContextStripMenu from "./contextStripMenu";

describe("ContextStripMenu", () => {
	it("Show only button when first render", () => {
		render(
			<ContextStripMenu
				title="Выберите роль"
				items={["Фрилансер", "Заказчик"]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Выберите роль" }),
		).toBeInTheDocument();

		expect(screen.queryByText("Фрилансер")).not.toBeInTheDocument();
		expect(screen.queryByText("Заказчик")).not.toBeInTheDocument();
	});

	it("Open menu when user click on button", async () => {
		const user = userEvent.setup();

		render(
			<ContextStripMenu
				title="Выберите роль"
				items={["Фрилансер", "Заказчик"]}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Выберите роль" }));

		expect(screen.getByText("Фрилансер")).toBeInTheDocument();
		expect(screen.queryByText("Заказчик")).toBeInTheDocument();
	});

	it("call onSelect when choose an element", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		render(
			<ContextStripMenu
				title="Выберите роль"
				items={["Фрилансер", "Заказчик"]}
				onSelect={onSelect}
			/>
		);

		await user.click(screen.getByRole("button", { name: "Выберите роль" }));
		await user.click(screen.getByText("Заказчик"));

		expect(onSelect).toHaveBeenCalledWith("Заказчик");
		expect(onSelect).toHaveBeenCalledTimes(1);
	});

	it("Close menu when choose element", async () => {
		const user = userEvent.setup();

		render(
			<ContextStripMenu
				title="Выберите роль"
				items={["Фрилансер", "Заказчик"]}
			/>
		);

		await user.click(screen.getByRole("button", { name: "Выберите роль" }));
		expect(screen.getByText("Фрилансер")).toBeInTheDocument();

		await user.click(screen.getByText("Фрилансер"));

		expect(screen.queryByText("Фрилансер")).not.toBeInTheDocument();
		expect(screen.queryByText("Заказчик")).not.toBeInTheDocument();
	});
});
