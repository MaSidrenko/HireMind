import React, { useState } from "react";
import "./EmailVerify.css";
import { emailVerifyRequest } from "@/features";
import { useLocation, useNavigate } from "react-router-dom";

type EmailVerifyLocationState  = {
	userRole: string 
}

export default function EmailVerify() {
	const location = useLocation();

	const state = location.state as EmailVerifyLocationState | null;

	const navigate = useNavigate();
	const [codeEmail, setCodeEmail] = useState("");

	const [formError, setFormError] = useState("");

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		setCodeEmail(e.target.value);
		setFormError("");
	}

	async function handelSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!codeEmail.trim()) {
			setFormError("Введите код подтверждения");
			return;
		}

		if (codeEmail.length !== 6) {
			setFormError("Код должен содержать 6 символов");
			return;
		}

		try {
			await emailVerifyRequest(codeEmail);
			sessionStorage.removeItem("emailVerifyAllowed");
			navigate(state?.userRole === "Заказчик" ? "/projects/new" : "/projects");

		} catch (error) {
			if (error instanceof Error) {
				setFormError(error.message);
				return;
			}

			setFormError("Произошла неизвестная ошибка");
		}
	}

	return (
		<div className="box-email-verify card-email-verify">
			<form onSubmit={handelSubmit} noValidate>
				<h1>Подтвердите email</h1>
				<div className="line-form-email-verify">
					<label htmlFor="email-code">
						Код
						<input
							type="text"
							name="email-code"
							id="email-code"
							placeholder="Введите код подтверждения"
							value={codeEmail}
							onChange={handleChange}
							className="email-verify-code-input"
						/>
					</label>

					{formError && <p className="field-error">{formError}</p>}
					<button type="submit" className="email-code-verify-button">
						Подтвердить
					</button>
				</div>
			</form>
		</div>
	);
}
