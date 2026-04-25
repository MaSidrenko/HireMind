import type React from "react";
import "./SignIn.css";
import { useState } from "react";
import { type SignInForm, validateSignIn } from "./lib/validateSignIn";
import type { SignUpForm } from "../SignUpPage/lib/validateSignUp";

export default function SignIn() {
	const [form, setForm] = useState<SignInForm>({
		email: "",
		password: "",
	});

	const [errors, setErrors] = useState<
		Partial<Record<keyof SignUpForm, string>>
	>({});

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target;

		setForm((prev) => ({
			...prev,
			[name]: value,
		}));

		setErrors((prev) => ({
			...prev,
			[name]: "",
		}));
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const validationErrors = validateSignIn(form);

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		console.log("Form valid:", form);
	}

	return (
		<div className="box-sign-in card">
			<form onSubmit={handleSubmit} noValidate>
				<h1>Вход</h1>
				<p>Войдите в аккаунт что бы продолжить</p>
				<div className="line-form-sign-in">
					<label htmlFor="Email">
						Логин
						<input
							name="email"
							type="email"
							placeholder="Введите ваш email"
							id="Email"
							value={form.email}
							onChange={handleChange}
						/>
						{errors.email && (
							<span className="field-error">{errors.email}</span>
						)}
					</label>
					<label htmlFor="Password">
						Пароль
						<input
							name="password"
							type="password"
							placeholder="Введите ваш пароль"
							id="Password"
							value={form.password}
							onChange={handleChange}
						/>
						{errors.password && (
							<span className="field-error">
								{errors.password}
							</span>
						)}
					</label>
					<input
						type="submit"
						value="Войти"
						className="input-sign-in"
					/>
				</div>
			</form>
		</div>
	);
}
