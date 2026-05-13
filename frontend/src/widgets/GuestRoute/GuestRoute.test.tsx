import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "../../features/Auth/AuthContext";
import GuestRoute from "../GuestRoute/GuestRoute";


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

describe("GuestRoute", () => {
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
							<GuestRoute>
								<div>Guest page</div>
							</GuestRoute>
						}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByText("Загрузка")).toBeInTheDocument();
		expect(
			screen.getByText("Проверяем, есть ли активная сессия."),
		).toBeInTheDocument();
		expect(screen.queryByText("Guest page")).not.toBeInTheDocument();
	});

	it("render on children, if user not auth", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({
			isAuthenticated: false,
			loading: false,
		}));

		render(
			<MemoryRouter initialEntries={["/sign-in"]}>
				<Routes>
					<Route
						path="/sign-in"
						element={
							<GuestRoute>
								<div>Guest page</div>
							</GuestRoute>
						}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByText("Guest page")).toBeInTheDocument();
	});

	it("redirect on /profile, if user auth", () => {
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
							<GuestRoute>
								<div>Guest page</div>
							</GuestRoute>
						}
					/>
					<Route path="/profile" element={<div>Profile page</div>} />
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByText("Profile page")).toBeInTheDocument();
		expect(screen.queryByText("Guest page")).not.toBeInTheDocument();
	});
});
