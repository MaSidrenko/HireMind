import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";

vi.mock("@/features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("ProtectedRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Show loading, if auth checking", () => {
		mockedUseAuth.mockReturnValue({
			isAuthenticated: false,
			loading: true,
			user: null,
			login: vi.fn(),
			logout: vi.fn(),
		});
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
			screen.getByText("Проверка авторизации...."),
		).toBeInTheDocument();
		expect(screen.queryByText("Protected page")).not.toBeInTheDocument();
	});

	it("redirect on /sign-in, if user not auth", () => {
		mockedUseAuth.mockReturnValue({
			isAuthenticated: false,
			loading: false,
			user: null,
			login: vi.fn(),
			logout: vi.fn(),
		} as any);

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
		mockedUseAuth.mockReturnValue({
			isAuthenticated: true,
			loading: false,
			user: { id: 1, name: "Test User" },
			login: vi.fn(),
			logout: vi.fn(),
		} as any);

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
