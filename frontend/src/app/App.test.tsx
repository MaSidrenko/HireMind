import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../features/Auth/AuthContext";
import App from "./App";

vi.mock("../features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
	mockedUseAuth.mockReturnValue({
		user: null,
		isAuthenticated: false,
		loading: false,
		refreshAuth: vi.fn(),
		signIn: vi.fn(),
		signUp: vi.fn(),
		updateProfile: vi.fn(),
		logout: vi.fn(),
		...overrides,
	} as ReturnType<typeof useAuth>);
}

function renderApp(path = "/") {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>,
	);
}

describe("App", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders auth loading state before layout", () => {
		mockAuth({ loading: true });

		renderApp();

		expect(screen.getByText("Загрузка HireMind")).toBeInTheDocument();
		expect(screen.queryByText("HireMind")).not.toBeInTheDocument();
	});

	it("shows guest navigation for unauthenticated users", () => {
		mockAuth({ isAuthenticated: false, user: null });

		renderApp();

		expect(screen.getByRole("link", { name: "Вход" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Регистрация" })).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Профиль" })).not.toBeInTheDocument();
	});

	it("shows client navigation for authenticated client", () => {
		mockAuth({
			isAuthenticated: true,
			user: {
				id: 7,
				fullName: "Анна Заказчик",
				email: "anna@example.com",
				role: "client",
				contacts: {},
				isOnline: true,
			},
		});

		renderApp();

		expect(screen.getByRole("link", { name: "Профиль" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Фрилансеры" })).toBeInTheDocument();
		expect(screen.queryByRole("link", { name: "Вход" })).not.toBeInTheDocument();
	});
});
