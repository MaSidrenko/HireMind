import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RecoveryPassword from "./RecoveryPassword";

const { resetPasswordRequestMock } = vi.hoisted(() => ({
	resetPasswordRequestMock: vi.fn(),
}));

vi.mock("@/features", async () => {
	const actual = await vi.importActual<typeof import("@/features")>(
		"@/features",
	);

	return {
		...actual,
		resetPasswordRequest: resetPasswordRequestMock,
	};
});

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
	beforeEach(() => {
		vi.clearAllMocks();
		resetPasswordRequestMock.mockResolvedValue({
			message: "Если пользователь существует, то код отправлен на почту",
		});
	});

	it("renders recovery form", () => {
		renderRecoveryPassword();

		expect(
			screen.getByRole("heading", { name: "Восстановление пароля" }),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите ваш email"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Отправить код" }),
		).toBeInTheDocument();
	});

	it("navigates back to sign in", async () => {
		const user = userEvent.setup();
		renderRecoveryPassword();

		await user.click(screen.getByRole("link", { name: "Вернуться ко входу" }));

		expect(screen.getByText("Sign in page")).toBeInTheDocument();
	});

	it("does not submit empty email", async () => {
		const user = userEvent.setup();
		renderRecoveryPassword();

		await user.click(screen.getByRole("button", { name: "Отправить код" }));

		expect(screen.getByText("Введите email")).toBeInTheDocument();
		expect(resetPasswordRequestMock).not.toHaveBeenCalled();
	});

	it("shows success message after submit", async () => {
		const user = userEvent.setup();
		renderRecoveryPassword();

		await user.type(
			screen.getByPlaceholderText("Введите ваш email"),
			"test@test.com",
		);
		await user.click(screen.getByRole("button", { name: "Отправить код" }));

		expect(resetPasswordRequestMock).toHaveBeenCalledWith("test@test.com");
		expect(
			screen.getByText("Если пользователь существует, то код отправлен на почту"),
		).toBeInTheDocument();
	});
});
