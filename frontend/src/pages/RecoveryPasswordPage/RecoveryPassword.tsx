import type React from "react";
import { Link } from "react-router-dom";
import "./RecoveryPassword.css";

export default function RecoveryPassword() {
	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<div className="box-recovery-password card">
			<form onSubmit={handleSubmit} noValidate>
				<h1>Восстановление пароля</h1>
				<p>
					Введите email, привязанный к аккаунту, и мы поможем вернуть
					доступ
				</p>

				<div className="line-form-recovery-password">
					<label htmlFor="RecoveryEmail">
						Email
						<input
							id="RecoveryEmail"
							name="email"
							type="email"
							placeholder="Введите ваш email"
						/>
					</label>

					<button type="submit" className="input-recovery-password">
						Отправить ссылку
					</button>

					<span className="recovery-password-note">
						После подключения логики сюда можно будет отправлять
						ссылку или код для сброса пароля.
					</span>
				</div>

				<div className="recovery-password-links">
					<Link to="/sign-in">Вернуться ко входу</Link>
					<Link to="/sign-up">Создать новый аккаунт</Link>
				</div>
			</form>
		</div>
	);
}
