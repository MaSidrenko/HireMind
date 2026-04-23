import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import GuestRoute from "../GuestRoute/GuestRoute";


vi.mock("@/features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("GuestRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Show loading, if auth checking", () => {
		mockedUseAuth.mockReturnValue({
			isAuthenticated: false,
			loading: true,
			user: null,
			login: vi.fn(),
			logout: vi.fn()
		} as any);

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

		expect(screen.getByText("Загрузка....")).toBeInTheDocument();
		expect(screen.queryByText("Guest page")).not.toBeInTheDocument();
	});

	it("render on children, if user not auth", () => {
		mockedUseAuth.mockReturnValue({
			isAuthenticated: false,
			loading: false,
			user: null,
			login: vi.fn(),
			logout: vi.fn(),
		} as any);

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