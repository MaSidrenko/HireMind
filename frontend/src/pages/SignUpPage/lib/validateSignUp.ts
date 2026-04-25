import { isEmailValid, isPhoneValid, isPasswordValid } from "@/shared";

export type SignUpForm = {
	lastName: string;
	firstName: string;
	middleName: string;
	email: string;
	password: string;
	confirmPassword: string;
	role: string;
	company?: string;
	telegram?: string;
	phone?: string;
};

export type SignUpErrors = Partial<Record<keyof SignUpForm, string>>;

export function validateSignUp(form: SignUpForm): SignUpErrors {
	const errors: SignUpErrors = {};

	if (!form.lastName.trim()) errors.lastName = "Введите фамилию";
	if (!form.firstName.trim()) errors.firstName = "Введите имя";

	if (!form.email.trim()) {
		errors.email = "Введите email";
	} else if (!isEmailValid(form.email)) {
		errors.email = "Введите корректный email";
	}

	if (!form.password) {
		errors.password = "Введите пароль";
	} else if (!isPasswordValid(form.password)) {
		errors.password =
			"Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву, одну цифру и один символ и состоять и 8 символов";
	}

	if(!form.confirmPassword) {
		errors.confirmPassword = "Подтвердите пароль";
	} else if(form.password !== form.confirmPassword) {
		errors.confirmPassword = "Пароли не совпадают";
	}

	if(form.role === "Выберите роль") {
		errors.role = "Выберите роль";
	}

	if(form.role === "Заказчик" && !form.company?.trim()) {
		errors.company = "Введите название компании";
	}

	if(form.phone?.trim() && !isPhoneValid(form.phone)) {
		errors.phone = "Введите корректный номер телефона";
	}

	return errors;
}
