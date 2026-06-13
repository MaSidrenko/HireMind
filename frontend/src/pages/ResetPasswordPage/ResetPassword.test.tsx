import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResetPassword from "./ResetPassword";

function renderResetPassword() {
	return render(
		<MemoryRouter initialEntries={["/recovery-password/confirm"]}>
			<Routes>
				<Route
					path="/recovery-password/confirm"
					element={<ResetPassword />}
				/>
				<Route
					path="/recovery-password"
					element={<div>Recovery request page</div>}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

describe("ResetPassword", () => {
	it("renders recovery confirm form", () => {
		renderResetPassword();

		expect(
			screen.getByRole("heading", { name: "Новый пароль" }),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите код из письма"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите новый пароль"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Сохранить новый пароль" }),
		).toBeInTheDocument();
	});

	it("shows validation on empty submit", async () => {
		const user = userEvent.setup();
		renderResetPassword();

		await user.click(
			screen.getByRole("button", { name: "Сохранить новый пароль" }),
		);

		expect(screen.getByText("Введите email")).toBeInTheDocument();
	});

	it("navigates back to recovery request page", async () => {
		const user = userEvent.setup();
		renderResetPassword();

		await user.click(
			screen.getByRole("link", { name: "Запросить код ещё раз" }),
		);

		expect(screen.getByText("Recovery request page")).toBeInTheDocument();
	});
});
