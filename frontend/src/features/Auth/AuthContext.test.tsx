import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { getMe } from "./getMe";
import type { User } from "./getMe.types";

vi.mock("./getMe", () => ({
	getMe: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);

const clientUser: User = {
	id: 1,
	email: "ivan@example.com",
	fullName: "Иван Иванов",
	role: "client",
	contacts: {},
	isOnline: true,
	companyName: "HireMind",
};

const freelancerUser: User = {
	id: 2,
	email: "newuser@example.com",
	fullName: "Новый Пользователь",
	role: "freelancer",
	contacts: {},
	isOnline: true,
	skills: [],
};

function TestConsumer() {
	const { user, isAuthenticated, loading, refreshAuth, logout } = useAuth();

	return (
		<div>
			<div data-testid="loading">{String(loading)}</div>
			<div data-testid="is-authenticated">{String(isAuthenticated)}</div>
			<div data-testid="user-email">{user?.email ?? "null"}</div>

			<button type="button" onClick={() => void refreshAuth()}>
				refresh
			</button>

			<button type="button" onClick={() => void logout()}>
				logout
			</button>
		</div>
	);
}

describe("AuthProvider", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		globalThis.fetch = vi.fn();
		vi.clearAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("calls getMe on mount and sets authenticated user", async () => {
		mockedGetMe.mockResolvedValue(clientUser);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		expect(screen.getByTestId("loading")).toHaveTextContent("true");

		await waitFor(() => {
			expect(mockedGetMe).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
			"true",
		);
		expect(screen.getByTestId("user-email")).toHaveTextContent(
			"ivan@example.com",
		);
	});

	it("sets unauthenticated state when getMe returns null", async () => {
		mockedGetMe.mockResolvedValue(null);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
			"false",
		);
		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
	});

	it("handles getMe error and finishes loading", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		mockedGetMe.mockRejectedValue(new Error("Network error"));

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
			"false",
		);
		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it("refreshAuth updates auth state", async () => {
		mockedGetMe
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(freelancerUser);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
			"false",
		);
		expect(screen.getByTestId("user-email")).toHaveTextContent("null");

		fireEvent.click(screen.getByRole("button", { name: "refresh" }));

		await waitFor(() => {
			expect(mockedGetMe).toHaveBeenCalledTimes(2);
		});

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
				"true",
			);
		});

		expect(screen.getByTestId("user-email")).toHaveTextContent(
			"newuser@example.com",
		);
	});

	it("logout sends request and clears user", async () => {
		mockedGetMe.mockResolvedValue(clientUser);

		vi.mocked(globalThis.fetch).mockResolvedValue(
			new Response("", {
				status: 200,
			}),
		);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
				"true",
			);
		});

		fireEvent.click(screen.getByRole("button", { name: "logout" }));

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		});

		const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
		expect(url).toEqual(expect.stringContaining("/api/v1/auth/logout"));
		expect(init).toMatchObject({
			method: "POST",
			credentials: "include",
		});

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
				"false",
			);
		});

		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
	});

	it("clears user even if logout request fails", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		mockedGetMe.mockResolvedValue(clientUser);

		vi.mocked(globalThis.fetch).mockRejectedValue(
			new Error("Logout failed"),
		);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
				"true",
			);
		});

		fireEvent.click(screen.getByRole("button", { name: "logout" }));

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
				"false",
			);
		});

		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});
});

describe("useAuth", () => {
	it("throws error when used outside AuthProvider", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		function TestComponent() {
			useAuth();
			return null;
		}

		expect(() => render(<TestComponent />)).toThrow(
			"useAuth must be used inside AuthProvider",
		);

		consoleErrorSpy.mockRestore();
	});
});
