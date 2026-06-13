import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "../../features/Auth";
import SignIn from "./SignIn";

vi.mock("@/features/Auth", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const signInMock = vi.fn();

function renderSignIn() {
	return render(
		<MemoryRouter initialEntries={["/sign-in"]}>
			<Routes>
				<Route path="/sign-in" element={<SignIn />} />
				<Route path="/profile" element={<div>Profile page</div>} />
				<Route
					path="/recovery-password"
					element={<div>Recovery page</div>}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

describe("SignIn", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		signInMock.mockResolvedValue(undefined);
		mockedUseAuth.mockReturnValue({
			user: null,
			isAuthenticated: false,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: signInMock,
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);
	});

	it("Render basic forms", () => {
		renderSignIn();

		expect(
			screen.getByRole("heading", { name: "Вход" }),
		).toBeInTheDocument();

		expect(
			screen.getByText("Войдите в аккаунт что бы продолжить"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Введите ваш email"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Введите ваш пароль"),
		).toBeInTheDocument();

		expect(screen.getByDisplayValue("Войти")).toBeInTheDocument();
	});

	it("call submit form", async () => {
		const user = userEvent.setup();

		renderSignIn();

		await user.type(
			screen.getByPlaceholderText("Введите ваш email"),
			"test@test.com",
		);

		await user.type(
			screen.getByPlaceholderText("Введите ваш пароль"),
			"Password123!",
		);

		await user.click(screen.getByRole("button", { name: "Войти" }));

		await waitFor(() => {
			expect(signInMock).toHaveBeenCalledWith(
				"test@test.com",
				"Password123!",
			);
		});
		expect(screen.getByText("Profile page")).toBeInTheDocument();
	});

	it("does not submit invalid form", async () => {
		const user = userEvent.setup();

		renderSignIn();

		await user.click(screen.getByRole("button", { name: "Войти" }));

		expect(screen.getAllByText("Поле обязательно")).toHaveLength(2);
		expect(signInMock).not.toHaveBeenCalled();
	});

	it("navigates to recovery password page", async () => {
		const user = userEvent.setup();
		renderSignIn();

		await user.click(screen.getByRole("link", { name: "Забыли пароль?" }));

		expect(screen.getByText("Recovery page")).toBeInTheDocument();
	});
});
