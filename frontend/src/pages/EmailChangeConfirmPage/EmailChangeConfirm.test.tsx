import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmailChangeConfirm from "./EmailChangeConfirm";
import { confirmEmailChangeRequest, useAuth } from "@/features";

vi.mock("@/features", () => ({
	confirmEmailChangeRequest: vi.fn(),
	useAuth: vi.fn(),
}));

const mockedConfirmEmailChangeRequest = vi.mocked(confirmEmailChangeRequest);
const mockedUseAuth = vi.mocked(useAuth);

function renderPage(initialEntry = "/email-change/confirm") {
	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route path="/email-change/confirm" element={<EmailChangeConfirm />} />
				<Route path="/sign-in" element={<div>Sign in page</div>} />
				<Route path="/profile" element={<div>Profile page</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("EmailChangeConfirm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseAuth.mockReturnValue({
			user: null,
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
			refreshAuth: vi.fn().mockResolvedValue(undefined),
			replaceUser: vi.fn(),
			isAuthenticated: false,
			loading: false,
		} as ReturnType<typeof useAuth>);
	});

	it("confirms a pending email change and redirects to sign in", async () => {
		const user = userEvent.setup();
		mockedConfirmEmailChangeRequest.mockResolvedValue({
			message: "Новый email успешно подтвержден",
		});

		renderPage("/email-change/confirm?email=new@example.com");

		await user.type(
			screen.getByLabelText("Код"),
			"123456",
		);
		await user.click(screen.getByRole("button", { name: "Подтвердить" }));

		await waitFor(() => {
			expect(mockedConfirmEmailChangeRequest).toHaveBeenCalledWith(
				"new@example.com",
				"123456",
			);
		});

		expect(await screen.findByText("Sign in page")).toBeInTheDocument();
	});
});
