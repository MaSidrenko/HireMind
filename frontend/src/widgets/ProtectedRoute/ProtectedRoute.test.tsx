import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "../../features/Auth/AuthContext";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";

vi.mock("@/features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function makeAuthState(
	overrides: Partial<ReturnType<typeof useAuth>>,
): ReturnType<typeof useAuth> {
	return {
		user: null,
		isAuthenticated: false,
		loading: false,
		refreshAuth: vi.fn(),
		signIn: vi.fn(),
		signUp: vi.fn(),
		updateProfile: vi.fn(),
		logout: vi.fn(),
		...overrides,
	};
}

describe("ProtectedRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Show loading, if auth checking", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({
			loading: true,
		}));
		render(
			<MemoryRouter initialEntries={["/sign-in"]}>
				<Routes>
					<Route
						path="/sign-in"
						element={
							<ProtectedRoute>
								<div>Protected page</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			</MemoryRouter>,
		);
		expect(
			screen.getByText("Проверяем доступ"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Сверяем роль и состояние авторизации."),
		).toBeInTheDocument();
		expect(screen.queryByText("Protected page")).not.toBeInTheDocument();
	});

	it("redirect on /sign-in, if user not auth", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({
			isAuthenticated: false,
			loading: false,
		}));

		render(
			<MemoryRouter initialEntries={["/profile"]}>
				<Routes>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<div>Protected page</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/sign-in" element={<div>Sign in page</div>} />
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText("Sign in page")).toBeInTheDocument();
		expect(screen.queryByText("Protected page")).not.toBeInTheDocument();
	});

	it("render children, if user auth", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({
			isAuthenticated: true,
			loading: false,
			user: {
				id: 1,
				fullName: "Test User",
				email: "test@example.com",
				role: "client",
				contacts: {},
				isOnline: true,
			},
		}));

		render(
			<MemoryRouter initialEntries={["/sign-in"]}>
				<Routes>
					<Route
						path="/sign-in"
						element={
							<ProtectedRoute>
								<div>Protected page</div>
							</ProtectedRoute>
						}
					/>
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText("Protected page")).toBeInTheDocument();
	});
});
