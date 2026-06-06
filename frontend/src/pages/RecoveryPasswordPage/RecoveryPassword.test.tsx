import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RecoveryPassword from "./RecoveryPassword";

function renderRecoveryPassword() {
	return render(
		<MemoryRouter initialEntries={["/recovery-password"]}>
			<Routes>
				<Route
					path="/recovery-password"
					element={<RecoveryPassword />}
				/>
				<Route path="/sign-in" element={<div>Sign in page</div>} />
				<Route path="/sign-up" element={<div>Sign up page</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("RecoveryPassword", () => {
	it("renders recovery form", () => {
		renderRecoveryPassword();

		expect(
			screen.getByRole("heading", { name: "Восстановление пароля" }),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите ваш email"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Отправить ссылку" }),
		).toBeInTheDocument();
	});

	it("navigates back to sign in", async () => {
		const user = userEvent.setup();
		renderRecoveryPassword();

		await user.click(screen.getByRole("link", { name: "Вернуться ко входу" }));

		expect(screen.getByText("Sign in page")).toBeInTheDocument();
	});
});
