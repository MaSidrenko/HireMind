import { isEmailValid, isPasswordValid } from "@/shared";

export type SignInForm = {
	email: string;
	password: string;
};

export type SignInErrors = Partial<Record<keyof SignInForm, string>>;

export function validateSignIn(form: SignInForm): SignInErrors {
	const errors: SignInErrors = {};

	if (!form.email.trim()) errors.email = "Поле обязательно";
	else if (!isEmailValid(form.email)) errors.email = "Неверный формат email";

	if (!form.password.trim()) errors.password = "Поле обязательно";
	else if (!isPasswordValid(form.password))
		errors.password =
			"Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один символ и состоять и 8 символов";

	return errors;
}
