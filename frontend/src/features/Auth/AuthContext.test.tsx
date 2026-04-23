import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { getMe } from "./getMe";

vi.mock("./getMe", () => ({
	getMe: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);

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
		mockedGetMe.mockResolvedValue({
			id: 1,
			email: "ivan@example.com",
			fullName: "Иван Иванов",
			role: "customer",
		} as any);

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

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
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

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
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

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
	});

	it("refreshAuth updates auth state", async () => {
		mockedGetMe
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: 2,
				email: "newuser@example.com",
				fullName: "Новый Пользователь",
				role: "freelancer",
			} as any);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
		expect(screen.getByTestId("user-email")).toHaveTextContent("null");

		fireEvent.click(screen.getByRole("button", { name: "refresh" }));

		await waitFor(() => {
			expect(mockedGetMe).toHaveBeenCalledTimes(2);
		});

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
		});

		expect(screen.getByTestId("user-email")).toHaveTextContent(
			"newuser@example.com",
		);
	});

	it("logout sends request and clears user", async () => {
		mockedGetMe.mockResolvedValue({
			id: 1,
			email: "ivan@example.com",
			fullName: "Иван Иванов",
			role: "customer",
		} as any);

		vi.mocked(globalThis.fetch).mockResolvedValue({
			ok: true,
		} as Response);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
		});

		fireEvent.click(screen.getByRole("button", { name: "logout" }));

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		});

		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/auth/logout"),
			{
				method: "POST",
				credentials: "include",
			},
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("user-email")).toHaveTextContent("null");
	});

	it("clears user even if logout request fails", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		mockedGetMe.mockResolvedValue({
			id: 1,
			email: "ivan@example.com",
			fullName: "Иван Иванов",
			role: "customer",
		} as any);

		vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Logout failed"));

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
		});

		fireEvent.click(screen.getByRole("button", { name: "logout" }));

		await waitFor(() => {
			expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
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