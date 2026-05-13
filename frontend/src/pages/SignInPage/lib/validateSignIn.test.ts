import { describe, expect, it, vi } from "vitest";
import { validateSignIn, type SignInForm } from "./validateSignIn";

vi.mock("@/shared", () => ({
	isEmailValid: vi.fn((email: string) => email === "test@example.com"),
	isPasswordValid: vi.fn((password: string) => password === "Password1!"),
}));

const validForm: SignInForm = {
	email: "test@example.com",
	password: "Password1!",
};

describe("validateSignIn", () => {
	it("returns empty errors object for valid form", () => {
		const errors = validateSignIn(validForm);
		expect(errors).toEqual({});
	});

	it("requires email field", () => {
		const errors = validateSignIn({
			...validForm,
			email: "",
		});

		expect(errors.email).toBe("Поле обязательно");
	});

	it("validates incorrect email", () => {
		const errors = validateSignIn({
			...validForm,
			email: "wrong-email",
		});

		expect(errors.email).toBe("Неверный формат email");
	});

	it("requires email if it contains only spaces", () => {
		const errors = validateSignIn({
			...validForm,
			email: "   ",
		});

		expect(errors.email).toBe("Поле обязательно");
	});

	it("requires password", () => {
		const errors = validateSignIn({
			...validForm,
			password: "",
		});

		expect(errors.password).toBe("Поле обязательно");
	});

	it("validates incorrect password", () => {
		const errors = validateSignIn({
			...validForm,
			password: "123",
		});

		expect(errors.password).toBe(
			"Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один символ и состоять и 8 символов",
		);
	});
});
