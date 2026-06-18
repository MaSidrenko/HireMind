import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmEmailChangeRequest, useAuth } from "@/features";
import { isEmailValid } from "@/shared";
import "../EmailVerifyPage/EmailVerify.css";

export default function EmailChangeConfirm() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isAuthenticated, refreshAuth } = useAuth();
	const [email, setEmail] = useState(searchParams.get("email") ?? "");
	const [code, setCode] = useState("");
	const [formError, setFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleChange(
		event: React.ChangeEvent<HTMLInputElement>,
		field: "email" | "code",
	) {
		const { value } = event.target;

		if (field === "email") {
			setEmail(value);
		} else {
			setCode(value);
		}

		setFormError("");
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!email.trim()) {
			setFormError("Введите новый email");
			return;
		}

		if (!isEmailValid(email.trim())) {
			setFormError("Введите корректный email");
			return;
		}

		if (!code.trim()) {
			setFormError("Введите код подтверждения");
			return;
		}

		if (code.trim().length !== 6) {
			setFormError("Код должен содержать 6 символов");
			return;
		}

		setIsSubmitting(true);
		setFormError("");

		try {
			await confirmEmailChangeRequest(email, code);
			await refreshAuth().catch(() => undefined);
			navigate(isAuthenticated ? "/profile" : "/sign-in");
		} catch (error) {
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError("Произошла неизвестная ошибка");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="box-email-verify card-email-verify">
			<form onSubmit={handleSubmit} noValidate>
				<h1>Подтвердите новый email</h1>
				<div className="line-form-email-verify">
					<label htmlFor="pending-email">
						Новый email
						<input
							type="email"
							name="pending-email"
							id="pending-email"
							placeholder="Введите новый email"
							value={email}
							onChange={(event) => handleChange(event, "email")}
							className="email-verify-code-input"
						/>
					</label>
					<label htmlFor="pending-email-code">
						Код
						<input
							type="text"
							name="pending-email-code"
							id="pending-email-code"
							placeholder="Введите код подтверждения"
							value={code}
							onChange={(event) => handleChange(event, "code")}
							className="email-verify-code-input"
						/>
					</label>

					{formError ? <p className="field-error">{formError}</p> : null}
					<button
						type="submit"
						className="email-code-verify-button"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Подтверждаем..." : "Подтвердить"}
					</button>
				</div>
			</form>
		</div>
	);
}
