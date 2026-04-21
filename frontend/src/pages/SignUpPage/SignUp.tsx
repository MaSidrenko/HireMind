import ContextStripMenu from "@/widgets/contextStripMenu/contextStripMenu";
import "./SignUp.css";
import { useEffect, useRef, useState } from "react";

export default function SignUp() {
	const [selectedRole, setSelectedRole] = useState("Выберите роль");

	return (
		<div className="box-sign-up card">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					console.log("submit");
				}}
			>
				<h1>Регистрация</h1>
				<p>Создайте свой аккаунт, чтобы начать</p>
				<label htmlFor="FullName">
					ФИО:
					<div className="line-form-sign-up">
						<input
							type="text"
							placeholder="Введите вашу фамилию"
							id="FullName"
						/>
						<input
							type="text"
							placeholder="Введите ваше имя"
							id="FullName"
						/>
						<input
							type="text"
							placeholder="Введите ваше отчество"
							id="FullName"
						/>
					</div>
				</label>
				<label htmlFor="Email">
					Email
					<input
						type="email"
						placeholder="Введите ваш email"
						id="Email"
					/>
				</label>
				<label htmlFor="Password">
					Пароль
					<input
						type="password"
						placeholder="Введите ваш пароль"
						id="Password"
					/>
				</label>
				<label htmlFor="ConfirmPassword">
					Подтвердите пароль
					<input
						type="password"
						placeholder="Подтвердите ваш пароль"
						id="ConfirmPassword"
					/>
				</label>
				<label htmlFor="" className="role-row">
					Роль:
					<ContextStripMenu
						title={selectedRole}
						items={["Фрилансер", "Заказчик"]}
						onSelect={(item) => setSelectedRole(item)}
					/>
				</label>
				{selectedRole == "Фрилансер" && (
					<label htmlFor="Skills">
						Навыки
						<input
							type="text"
							placeholder="Введите ваши навыки через запятую"
							id="Skills"
						/>
					</label>
				)}

				{selectedRole == "Заказчик" && (
					<label htmlFor="Company">
						Компания
						<input
							type="text"
							placeholder="Введите название вашей компании"
							id="Company"
						/>
					</label>
				)}
				<label htmlFor="Contacts">
					Контакты
					<input
						type="text"
						placeholder="Введите ваш Telegram ID"
						id="Contacts"
					/>
					<input type="text" placeholder="+7 999 123 45 67" />
				</label>
				<input type="submit" value="Submit" className="input-sign-up" />
			</form>
		</div>
	);
}
