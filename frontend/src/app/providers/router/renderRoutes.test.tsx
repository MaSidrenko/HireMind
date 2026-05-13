import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AppPage } from "../../../shared";
import { useAuth } from "../../../features/Auth/AuthContext";
import { renderRoutes } from "./renderRoutes";

vi.mock("@/features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const Component = () => <div>Protected content</div>;

function makeAuthState(overrides: Partial<ReturnType<typeof useAuth>>) {
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
	} as ReturnType<typeof useAuth>;
}

function renderAt(page: AppPage, path = page.path) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>{renderRoutes([page])}</Routes>
		</MemoryRouter>,
	);
}

describe("renderRoutes", () => {
	it("renders public route directly", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({}));

		renderAt({
			path: "/public",
			label: "Public",
			component: Component,
			access: "public",
		});

		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});

	it("wraps private routes with auth guard", () => {
		mockedUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false }));

		renderAt({
			path: "/private",
			label: "Private",
			component: Component,
			access: "private",
		});

		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});

	it("allows role route for matching user role", () => {
		mockedUseAuth.mockReturnValue(
			makeAuthState({
				isAuthenticated: true,
				user: {
					id: 1,
					fullName: "Анна",
					email: "anna@example.com",
					role: "client",
					contacts: {},
					isOnline: true,
				},
			}),
		);

		renderAt({
			path: "/client",
			label: "Client",
			component: Component,
			access: "client",
		});

		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});
});
