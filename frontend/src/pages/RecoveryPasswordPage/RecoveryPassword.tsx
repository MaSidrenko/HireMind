import type React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPasswordRequest } from "@/features";
import { isEmailValid } from "@/shared";
import "./RecoveryPassword.css";

export default function RecoveryPassword() {
	const [email, setEmail] = useState("");
	const [fieldError, setFieldError] = useState("");
	const [formError, setFormError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const normalizedEmail = email.trim();

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

		setIsSubmitting(true);

		try {
			const response = await resetPasswordRequest(normalizedEmail);
			setSuccessMessage(response.message);
			setEmail("");
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Не удалось отправить код восстановления",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="box-recovery-password card">
			<form onSubmit={handleSubmit} noValidate>
					<div className="recovery-password-main">
						<h1>Восстановление пароля</h1>
						<p>
							Введите email, привязанный к аккаунту, и мы отправим
							код для восстановления доступа.
						</p>

						<div className="line-form-recovery-password">
							<label htmlFor="RecoveryEmail">
								Email
								<input
									id="RecoveryEmail"
									name="email"
									type="email"
									placeholder="Введите ваш email"
									value={email}
									onChange={(event) => {
										setEmail(event.target.value);
										setFieldError("");
										setFormError("");
										setSuccessMessage("");
									}}
									disabled={isSubmitting}
								/>
								{fieldError ? (
									<span className="field-error">
										{fieldError}
									</span>
								) : null}
							</label>

							<button
								type="submit"
								className="input-recovery-password"
								disabled={isSubmitting}
							>
								{isSubmitting
									? "Отправляем..."
									: "Отправить код"}
							</button>

							{formError ? (
								<span className="field-error">{formError}</span>
							) : null}

							{successMessage ? (
								<span className="recovery-password-success">
									{successMessage}
								</span>
							) : null}

							<Link
								to="/recovery-password/confirm"
								state={{ email: email.trim() }}
								className="recovery-password-inline-link"
							>
								У меня уже есть код
							</Link>

							<span className="recovery-password-note">
								Если email привязан к аккаунту, на него придёт
								код подтверждения для следующего шага сброса.
							</span>
						</div>
					</div>
				<div className="recovery-password-links">
					<Link to="/sign-in">Вернуться ко входу</Link>
					<Link to="/sign-up">Создать новый аккаунт</Link>
				</div>
			</form>
		</div>
	);
}
