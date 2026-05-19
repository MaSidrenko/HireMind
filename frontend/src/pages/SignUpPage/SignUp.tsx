import ContextStripMenu from "@/widgets/contextStripMenu/contextStripMenu";
import "./SignUp.css";
import React, { useState } from "react";
import { validateSignUp, type SignUpForm } from "./lib/validateSignUp";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features";

export default function SignUp() {
	const navigate = useNavigate();
	const { signUp } = useAuth();
	const [form, setForm] = useState<SignUpForm>({
		lastName: "",
		firstName: "",
		middleName: "",
		email: "",
		password: "",
		confirmPassword: "",
		role: "Выберите роль",
		company: "",
		telegram: "",
		phone: "",
	});

	const [errors, setErrors] = useState<
		Partial<Record<keyof SignUpForm, string>>
	>({});
	const [formError, setFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const validationErrors = validateSignUp(form);

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsSubmitting(true);
		setFormError("");

		try {
			await signUp({
				fullName:
					`${form.lastName} ${form.firstName} ${form.middleName}`.trim(),
				email: form.email,
				password: form.password,
				role: form.role === "Заказчик" ? "client" : "freelancer",
				companyName: form.company,
				contacts: {
					telegram: form.telegram,
					phone: form.phone,
				},
			});

			sessionStorage.setItem("emailVerifyAllowed", "true");

			navigate("/email-code", {
				state: {
					 email: form.email,
					userRole: form.role,
				},
			});
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Не удалось зарегистрироваться",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="box-sign-up card">
			<form onSubmit={handleSubmit}>
				<h1>Регистрация</h1>
				<p>Создайте свой аккаунт, чтобы начать</p>
				<label>
					{form.role === "Заказчик"
						? "ФИО контактного лица* "
						: "ФИО*"}
					{/* ФИО: */}
					<div className="line-form-sign-up">
						<div className="fio-field">
							<input
								name="lastName"
								type="text"
								placeholder="Введите вашу фамилию"
								id="lastName"
								value={form.lastName}
								onChange={handleChange}
							/>
							{errors.lastName && (
								<span className="field-error">
									{errors.lastName}
								</span>
							)}
						</div>

						<div className="fio-field">
							<input
								name="firstName"
								type="text"
								placeholder="Введите ваше имя"
								id="firstName"
								value={form.firstName}
								onChange={handleChange}
							/>
							{errors.firstName && (
								<span className="field-error">
									{errors.firstName}
								</span>
							)}
						</div>

						<div className="fio-field">
							<input
								name="middleName"
								type="text"
								placeholder="Введите ваше отчество"
								id="middleName"
								value={form.middleName}
								onChange={handleChange}
							/>
							{errors.middleName && (
								<span className="field-error">
									{errors.middleName}
								</span>
							)}
						</div>
					</div>
				</label>
				<label htmlFor="Email">
					Email*
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
					Пароль*
					<input
						name="password"
						type="password"
						placeholder="Введите ваш пароль"
						id="Password"
						value={form.password}
						onChange={handleChange}
					/>
					{errors.password && (
						<span className="field-error">{errors.password}</span>
					)}
				</label>
				<label htmlFor="ConfirmPassword">
					Подтвердите пароль*
					<input
						name="confirmPassword"
						type="password"
						placeholder="Подтвердите ваш пароль"
						id="ConfirmPassword"
						value={form.confirmPassword}
						onChange={handleChange}
					/>
					{errors.confirmPassword && (
						<span className="field-error">
							{errors.confirmPassword}
						</span>
					)}
				</label>
				<label htmlFor="" className="role-row">
					Роль*
					<ContextStripMenu
						title={form.role}
						items={["Фрилансер", "Заказчик"]}
						onSelect={(item) => {
							setForm((prev) => ({
								...prev,
								role: item,
							}));

							setErrors((prev) => ({
								...prev,
								role: "",
							}));
						}}
					/>
					{errors.role && (
						<span className="field-error">{errors.role}</span>
					)}
				</label>

				{form.role === "Заказчик" && (
					<label htmlFor="Company">
						Компания*
						<input
							name="company"
							type="text"
							placeholder="Введите название вашей компании"
							id="Company"
							value={form.company}
							onChange={handleChange}
						/>
						{errors.company && (
							<span className="field-error">
								{errors.company}
							</span>
						)}
					</label>
				)}
				<label htmlFor="Contacts">
					Контакты*
					<input
						name="telegram"
						type="text"
						placeholder="Введите ваш Telegram ID"
						id="Contacts"
						value={form.telegram}
						onChange={handleChange}
					/>
					{errors.telegram && (
						<span className="field-error">{errors.telegram}</span>
					)}
					<input
						name="phone"
						type="text"
						placeholder="+7 999 123 45 67"
						value={form.phone}
						onChange={handleChange}
					/>
					{errors.phone && (
						<span className="field-error">{errors.phone}</span>
					)}
				</label>
				<input
					type="submit"
					value={
						isSubmitting
							? "Создаём аккаунт..."
							: "Зарегистрироваться"
					}
					className="input-sign-up"
					disabled={isSubmitting}
				/>
				{formError && <span className="field-error">{formError}</span>}
			</form>
		</div>
	);
}
