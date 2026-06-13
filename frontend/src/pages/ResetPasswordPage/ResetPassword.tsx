import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isEmailValid, isPasswordValid } from "@/shared";
import "./ResetPassword.css";
import { verifyPassword } from "@/features";

type ResetPasswordLocationState = {
	email?: string;
};

export default function ResetPassword() {
	const location = useLocation();
	const state = location.state as ResetPasswordLocationState | null;

	const [email, setEmail] = useState(state?.email ?? "");
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [fieldError, setFieldError] = useState("");
	const [formError, setFormError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function clearMessages() {
		setFieldError("");
		setFormError("");
		setSuccessMessage("");
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const normalizedEmail = email.trim();
		const normalizedCode = code.trim();

		setFieldError("");
		setFormError("");
		setSuccessMessage("");

		if (!normalizedEmail) {
			setFieldError("Введите email");
			return;
		}

		if (!isEmailValid(normalizedEmail)) {
			setFieldError("Введите корректный email");
			return;
		}

		if (!normalizedCode) {
			setFieldError("Введите код восстановления");
			return;
		}

		if (normalizedCode.length !== 6) {
			setFieldError("Код должен содержать 6 символов");
			return;
		}

		if (!password) {
			setFieldError("Введите новый пароль");
			return;
		}

		if (!isPasswordValid(password)) {
			setFieldError(
				"Пароль должен содержать заглавную, строчную букву, цифру и спецсимвол",
			);
			return;
		}

		if (!confirmPassword) {
			setFieldError("Подтвердите новый пароль");
			return;
		}

		if (password !== confirmPassword) {
			setFieldError("Пароли не совпадают");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await verifyPassword(
				normalizedEmail,
				normalizedCode,
				password,
			);
			setSuccessMessage(response.message);
			setCode("");
			setPassword("");
			setConfirmPassword("");
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Не удалось сохранить новый пароль",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="box-reset-password card">
			<form onSubmit={handleSubmit} noValidate>
				<div className="reset-password-layout">
					<div className="reset-password-main">
						<h1>Новый пароль</h1>
						<p>
							Введите код из письма и задайте новый пароль для
							аккаунта.
						</p>

						<div className="line-form-reset-password">
							<label htmlFor="ResetEmail">
								Email
								<input
									id="ResetEmail"
									name="email"
									type="email"
									placeholder="Введите ваш email"
									value={email}
									onChange={(event) => {
										setEmail(event.target.value);
										clearMessages();
									}}
									disabled={isSubmitting}
								/>
							</label>

							<label htmlFor="ResetCode">
								Код восстановления
								<input
									id="ResetCode"
									name="reset-code"
									type="text"
									placeholder="Введите код из письма"
									value={code}
									onChange={(event) => {
										setCode(event.target.value);
										clearMessages();
									}}
									disabled={isSubmitting}
								/>
							</label>

							<label htmlFor="ResetPassword">
								Новый пароль
								<input
									id="ResetPassword"
									name="password"
									type="password"
									placeholder="Введите новый пароль"
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										clearMessages();
									}}
									disabled={isSubmitting}
								/>
							</label>

							<label htmlFor="ResetPasswordConfirm">
								Подтвердите пароль
								<input
									id="ResetPasswordConfirm"
									name="confirm-password"
									type="password"
									placeholder="Повторите новый пароль"
									value={confirmPassword}
									onChange={(event) => {
										setConfirmPassword(event.target.value);
										clearMessages();
									}}
									disabled={isSubmitting}
								/>
							</label>

							{fieldError ? (
								<span className="field-error">{fieldError}</span>
							) : null}

							{formError ? (
								<span className="field-error">{formError}</span>
							) : null}

							{successMessage ? (
								<span className="reset-password-success">
									{successMessage}
								</span>
							) : null}

							<button
								type="submit"
								className="input-reset-password"
								disabled={isSubmitting}
							>
								{isSubmitting
									? "Сохраняем..."
									: "Сохранить новый пароль"}
							</button>

							<span className="reset-password-note">
								После успешной смены пароля можно сразу вернуться ко
								входу и авторизоваться с новым паролем.
							</span>
						</div>
					</div>

					<div className="reset-password-aside">
						<span className="reset-password-kicker">Что проверяем</span>
						<div className="reset-password-steps">
							<div className="reset-password-step">
								<strong>1. Email</strong>
								<p>
									Нужен тот же адрес, на который пришёл recovery-код.
								</p>
							</div>
							<div className="reset-password-step">
								<strong>2. Код из письма</strong>
								<p>
									На backend ты будешь сверять его с hash и сроком
									действия.
								</p>
							</div>
							<div className="reset-password-step">
								<strong>3. Новый пароль</strong>
								<p>
									После успешной проверки кода обновляешь
									`PasswordHash` и `Salt`.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="reset-password-links">
					<Link to="/recovery-password">Запросить код ещё раз</Link>
					<Link to="/sign-in">Вернуться ко входу</Link>
				</div>
			</form>
		</div>
	);
}
