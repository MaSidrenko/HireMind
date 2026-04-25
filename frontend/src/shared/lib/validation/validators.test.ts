import { describe, expect, it } from "vitest";
import { isEmailValid, isPasswordValid, isPhoneValid } from "./validators";

describe("isEmailValid", () => {
	it("returns true for valid emails", () => {
		expect(isEmailValid("test@example.com")).toBe(true);
		expect(isEmailValid("user.name@mail.co")).toBe(true);
		expect(isEmailValid("user+tag@mail.com")).toBe(true);
	});

	it("returns false for invalid emails", () => {
		expect(isEmailValid("")).toBe(false);
		expect(isEmailValid("test")).toBe(false);
		expect(isEmailValid("test@")).toBe(false);
		expect(isEmailValid("@example.com")).toBe(false);
		expect(isEmailValid("test@example")).toBe(false);
		expect(isEmailValid("test example@mail.com")).toBe(false);
		expect(isEmailValid("test@example.")).toBe(false);
	});
});

describe("isPhoneValid", () => {
	it("returns true for valid phones", () => {
		expect(isPhoneValid("+79991234567")).toBe(true);
		expect(isPhoneValid("89991234567")).toBe(true);
		expect(isPhoneValid("+7 999 123 45 67")).toBe(true);
		expect(isPhoneValid("+7 (999) 123-45-67")).toBe(true);
	});

	it("returns false for invalid phones", () => {
		expect(isPhoneValid("")).toBe(false);
		expect(isPhoneValid("abc")).toBe(false);
		expect(isPhoneValid("+")).toBe(false);
		expect(isPhoneValid("+7999")).toBe(false);
		expect(isPhoneValid("phone +79991234567")).toBe(false);
		expect(isPhoneValid("+7 999 123 45 67 abc")).toBe(false);
	});
});

describe("isPasswordValid", () => {
	it("returns true for valid passwords", () => {
		expect(isPasswordValid("Password1!")).toBe(true);
		expect(isPasswordValid("Qwerty123@")).toBe(true);
		expect(isPasswordValid("StrongPass9#")).toBe(true);
	});

	it("returns false if password is too short", () => {
		expect(isPasswordValid("Aa1!")).toBe(false);
	});

	it("returns false without lowercase letter", () => {
		expect(isPasswordValid("PASSWORD1!")).toBe(false);
	});

	it("returns false without uppercase letter", () => {
		expect(isPasswordValid("password1!")).toBe(false);
	});

	it("returns false without digit", () => {
		expect(isPasswordValid("Password!")).toBe(false);
	});

	it("returns false without special symbol", () => {
		expect(isPasswordValid("Password1")).toBe(false);
	});

	it("returns false for empty password", () => {
		expect(isPasswordValid("")).toBe(false);
	});
});