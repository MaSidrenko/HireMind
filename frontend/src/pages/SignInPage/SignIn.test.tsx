import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignIn from "./SignIn";

describe("SignIn", () => {
	it("Render basic forms", () => {
		render(<SignIn />);

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

		const consoleSpy = vi
			.spyOn(console, "log")
			.mockImplementation(() => {});

		render(<SignIn />);

		await user.type(
			screen.getByPlaceholderText("Введите ваш email"),
			"test@test.com",
		);

		await user.type(
			screen.getByPlaceholderText("Введите ваш пароль"),
			"Password123!",
		);

		await user.click(screen.getByRole("button", { name: "Войти" }));

		expect(consoleSpy).toHaveBeenCalledWith("Form valid:", {
			email: "test@test.com",
			password: "Password123!",
		});

		expect(consoleSpy).toHaveBeenCalledTimes(1);
	});

	it("does not submit invalid form", async () => {
		const user = userEvent.setup();

		render(<SignIn />);

		await user.click(screen.getByRole("button", { name: "Войти" }));

		expect(screen.getAllByText("Поле обязательно")).toHaveLength(2);
	});
});
