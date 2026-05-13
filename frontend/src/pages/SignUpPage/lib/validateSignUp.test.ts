import { describe, expect, it, vi } from "vitest";
import { validateSignUp, type SignUpForm } from "./validateSignUp";

vi.mock("@/shared", () => ({
	isEmailValid: vi.fn((email: string) => email === "test@mail.com"),
	isPasswordValid: vi.fn((password: string) => password === "Password1!"),
	isPhoneValid: vi.fn((phone: string) => phone === "+79991234567"),
}));

const validForm: SignUpForm = {
	lastName: "Иванов",
	firstName: "Иван",
	middleName: "Иванович",
	email: "test@mail.com",
	password: "Password1!",
	confirmPassword: "Password1!",
	role: "Фрилансер",
	company: "",
	telegram: "@ivan",
	phone: "",
};

describe("validateSignUp", () => {
	it("returns empty errors object for valid form", () => {
		const errors = validateSignUp(validForm);

		expect(errors).toEqual({});
	});

	it("requires lastName", () => {
		const errors = validateSignUp({
			...validForm,
			lastName: "",
		});

		expect(errors.lastName).toBe("Введите фамилию");
	});

	it("requires lastName if it contains only spaces", () => {
		const errors = validateSignUp({
			...validForm,
			lastName: "   ",
		});

		expect(errors.lastName).toBe("Введите фамилию");
	});

	it("requires firstName", () => {
		const errors = validateSignUp({
			...validForm,
			firstName: "",
		});

		expect(errors.firstName).toBe("Введите имя");
	});

	it("requires firstName if it contains only spaces", () => {
		const errors = validateSignUp({
			...validForm,
			firstName: "   ",
		});

		expect(errors.firstName).toBe("Введите имя");
	});

	it("requires email", () => {
		const errors = validateSignUp({
			...validForm,
			email: "",
		});

		expect(errors.email).toBe("Введите email");
	});

	it("requires email if it contains only spaces", () => {
		const errors = validateSignUp({
			...validForm,
			email: "   ",
		});

		expect(errors.email).toBe("Введите email");
	});

	it("validates incorrect email", () => {
		const errors = validateSignUp({
			...validForm,
			email: "wrong-email",
		});

		expect(errors.email).toBe("Введите корректный email");
	});

	it("requires password", () => {
		const errors = validateSignUp({
			...validForm,
			password: "",
		});

		expect(errors.password).toBe("Введите пароль");
	});

	it("validates incorrect password", () => {
		const errors = validateSignUp({
			...validForm,
			password: "123",
		});

		expect(errors.password).toBe(
			"Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один символ и состоять и 8 символов",
		);
	});

	it("requires confirmPassword", () => {
		const errors = validateSignUp({
			...validForm,
			confirmPassword: "",
		});

		expect(errors.confirmPassword).toBe("Подтвердите пароль");
	});

	it("checks password mismatch", () => {
		const errors = validateSignUp({
			...validForm,
			confirmPassword: "OtherPassword1!",
		});

		expect(errors.confirmPassword).toBe("Пароли не совпадают");
	});

	it("requires role", () => {
		const errors = validateSignUp({
			...validForm,
			role: "Выберите роль",
		});

		expect(errors.role).toBe("Выберите роль");
	});

	it("requires company if role is Заказчик", () => {
		const errors = validateSignUp({
			...validForm,
			role: "Заказчик",
			company: "",
		});

		expect(errors.company).toBe("Введите название компании");
	});

	it("requires company if role is Заказчик and company contains only spaces", () => {
		const errors = validateSignUp({
			...validForm,
			role: "Заказчик",
			company: "   ",
		});

		expect(errors.company).toBe("Введите название компании");
	});

	it("does not require company if role is not Заказчик", () => {
		const errors = validateSignUp({
			...validForm,
			role: "Фрилансер",
			company: "",
		});

		expect(errors.company).toBeUndefined();
	});

	it("does not validate phone if phone is empty", () => {
		const errors = validateSignUp({
			...validForm,
			phone: "",
		});

		expect(errors.phone).toBeUndefined();
	});

	it("does not validate phone if phone is undefined", () => {
		const errors = validateSignUp({
			...validForm,
			phone: undefined,
		});

		expect(errors.phone).toBeUndefined();
	});

	it("validates incorrect phone if phone is provided", () => {
		const errors = validateSignUp({
			...validForm,
			phone: "123",
		});

		expect(errors.phone).toBe("Введите корректный номер телефона");
	});

	it("allows correct phone if phone is provided", () => {
		const errors = validateSignUp({
			...validForm,
			phone: "+79991234567",
		});

		expect(errors.phone).toBeUndefined();
	});

	it("returns multiple errors at once", () => {
		const errors = validateSignUp({
			lastName: "",
			firstName: "",
			middleName: "",
			email: "",
			password: "",
			confirmPassword: "",
			role: "Выберите роль",
			company: "",
			telegram: "",
			phone: "123",
		});

		expect(errors).toEqual({
			lastName: "Введите фамилию",
			firstName: "Введите имя",
			email: "Введите email",
			password: "Введите пароль",
			confirmPassword: "Подтвердите пароль",
			role: "Выберите роль",
			phone: "Введите корректный номер телефона",
		});
	});
});
