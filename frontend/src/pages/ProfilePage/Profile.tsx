import { updateProfileSkills, useAuth } from "@/features";
import "./Profile.css";
import { useEffect, useState } from "react";
import SkillsAutocomplete from "@/widgets/SkillsAutoComplete/SkillsAutoComplete";
import { NavLink } from "react-router-dom";

type ProfileStats = {
	label: string;
	value: string;
	description: string;
};

const freelancerSkillsOptions = [
	"Frontend Development",
	"Backend Development",
	"Fullstack Development",
	"React",
	"TypeScript",
	"JavaScript",
	"Node.js",
	"UI/UX Design",
	"Figma",
	"Brand Design",
	"Motion Design",
	"Copywriting",
	"Content Marketing",
	"SEO",
	"SMM",
	"Project Management",
	"QA Testing",
	"Mobile Development",
	"Product Analytics",
	"AI Prompting",
];

export default function Profile() {
	const { user, logout } = useAuth();
	// const { user: authUser, logout } = useAuth();
	//Тестовые данные.
	//TODO: НЕ ЗАБУДЬ УДАЛИТЬ!
	// const user = authUser ?? {
	// 	id: 1,
	// 	fullName: "John Doe",
	// 	email: "john.doe@example.com",
	// 	role: "freelancer",
	// 	isOnline: true,
	// 	contacts: {
	// 		telegram: "@john_doe",
	// 		phone: "+792583456789",
	// 	},
	// 	skills: [],
	// };
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const [skillsError, setSkillsError] = useState<string | null>(null);
	const [isSavingSkills, setIsSavingSkills] = useState(false);

	useEffect(() => {
		if (!user) {
			setSelectedSkills([]);
			return;
		}

		if (user.role === "freelancer") {
			setSelectedSkills(user.skills ?? []);
		} else {
			setSelectedSkills([]);
		}
	}, [user]);
	if (!user) {
		return null;
	}

	const isFreelancer = user.role === "freelancer";
	const isClient = user.role === "client";

	const roleLabel = user.role === "client" ? "Заказчик" : "Исполнитель";

	const initials = user.fullName
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");

	const handleSkillsChange = async (skills: string[]) => {
		if (!isFreelancer || isSavingSkills) {
			return;
		}
		const previousSkills = selectedSkills;

		setSelectedSkills(skills);
		setSkillsError(null);
		setIsSavingSkills(true);

		// window.localStorage.setItem(
		// 	`hiremind-profile-skills-${user.id}`,
		// 	JSON.stringify(skills),
		// );

		try {
			await updateProfileSkills(skills);
		} catch (error) {
			console.error(error);
			setSelectedSkills(previousSkills);
			setSkillsError("Не удалось сохранить специальности");
		} finally {
			setIsSavingSkills(false);
		}
	};

	const profileStats: ProfileStats[] = [
		{
			label: "Статус",
			value: user.isOnline ? "В сети" : "Не в сети",
			description: user.isOnline
				? "Пользователь сейчас активен"
				: "Пользователь сейчас неактивен",
		},
		{
			label: "Роль",
			value: roleLabel,
			description: "Формат работы и доступные сценарии внутри платформы",
		},
		{
			label: "Контакты",
			value:
				user.contacts.telegram || user.contacts.phone
					? "Заполнены"
					: "Ожидают заполнения",
			description: "Чем больше данных, тем легче связаться с Вами",
		},
		{
			label: "Специальности",
			value: isFreelancer ? `${selectedSkills.length}` : "—",
			description: isFreelancer
				? "Поддерживайте список актуальным, чтобы быстрее находить релевантные проекты."
				: "Блок доступен для аккаунтов фрилансеров.",
		},
	];

	const quickActions = [
		{
			title: "Мои проекты",
			description: "Открывайте текущие задачи и следите за статусами.",
			to: "/projects",
			label: "Перейти",
		},
		{
			title: isFreelancer ? "Найти задачу" : "Найти исполнителя",
			description: isFreelancer
				? "Подберите новый проект под свою экспертизу."
				: "Откройте список проектов и начните поиск специалиста.",
			to: "/projects",
			label: "Смотреть проекты",
		},
	];

	return (
		<div className="profile-page">
			<section className="profile-hero">
				<div className="profile-hero__content">
					<div className="profile-identity">
						<div className="profile-avatar" aria-hidden="true">
							{initials || "HM"}
						</div>
						<div>
							<span className="profile-kicker">
								Личный кабинет
							</span>
							<h1>{user.fullName}</h1>
							<p>
								Управляйте своим профилем, контактами и рабочими
								сценариями в одном месте.
							</p>
						</div>
					</div>

					<div className="profile-highlight">
						<span className="profile-highlight__label">
							Основное
						</span>
						<div className="profile-highlight__row">
							<span>Email</span>
							<strong>{user.email}</strong>
						</div>
						<div className="profile-highlight__row">
							<span>Роль</span>
							<strong>{roleLabel}</strong>
						</div>
						{isClient ? (
							<div className="profile-highlight__row">
								<span>Компания</span>
								<strong>{user.companyName}</strong>
							</div>
						) : null}
					</div>
				</div>
			</section>
			<section className="profile-grid">
				<div className="profile-card profile-card--wide">
					<div className="profile-card__header">
						<h2>Обзор профиля</h2>
						<p>
							Короткий срез по состоянию аккаунта и готовности к
							работе.
						</p>
					</div>

					<div className="profile-stats">
						{profileStats.map((stat) => (
							<article key={stat.label} className="profile-stat">
								<span className="profile-stat__label">
									{stat.label}
								</span>
								<strong>{stat.value}</strong>
								<p>{stat.description}</p>
							</article>
						))}
					</div>
				</div>

				<div className="profile-card">
					<div className="profile-card__header">
						<h2>Контакты</h2>
						<p>Данные, по которым с вами удобно связаться.</p>
					</div>

					<div className="profile-info-list">
						<div className="profile-info-row">
							<span>Telegram</span>
							<strong>
								{user.contacts.telegram || "Не указан"}
							</strong>
						</div>
						<div className="profile-info-row">
							<span>Телефон</span>
							<strong>
								{user.contacts.phone || "Не указан"}
							</strong>
						</div>
						{isClient && (
							<div className="profile-info-row">
								<span>Компания</span>
								<strong>
									{user.companyName || "Не указана"}
								</strong>
							</div>
						)}
					</div>
				</div>
				<div className="profile-card">
					<div className="profile-card__header">
						<h2>Быстрые действия</h2>
						<p>Самые частые переходы из профиля.</p>
					</div>

					<div className="profile-actions">
						{quickActions.map((action) => (
							<NavLink
								key={action.title}
								to={action.to}
								className="profile-action"
							>
								<div>
									<h3>{action.title}</h3>
									<p>{action.description}</p>
								</div>
								<span>{action.label}</span>
							</NavLink>
						))}
						<button
							type="button"
							className="profile-logout"
							onClick={() => {
								void logout();
							}}
						>
							Выйти из аккаунта
						</button>
					</div>
				</div>

				{isFreelancer && (
					<div className="profile-card profile-card--wide">
						<div className="profile-card__header">
							<h2>Специальности</h2>
							<p>
								Добавьте направления, в которых вы работаете,
								чтобы профиль сразу показывал вашу экспертизу.
							</p>
						</div>

						<div className="profile-skills">
							<div className="profile-skills__editor">
								<SkillsAutocomplete
									options={freelancerSkillsOptions}
									maxSelected={8}
									value={selectedSkills}
									onChange={handleSkillsChange}
									hideHeader
									placeholder="Добавьте специальность"
									emptyText="Совпадений не найдено"
								/>
								{isSavingSkills && (
									<p className="profile-skills__saving">
										Сохраняем...
									</p>
								)}
								{skillsError && (
									<p className="profile-skills__error">
										{skillsError}
									</p>
								)}
							</div>

							<div className="profile-skills__summary">
								<span className="profile-skills__label">
									В профиле отображаются
								</span>
								{selectedSkills.length > 0 ? (
									<div className="profile-specialties">
										{selectedSkills.map((skill) => (
											<span
												key={skill}
												className="profile-specialty"
											>
												{skill}
											</span>
										))}
									</div>
								) : (
									<p className="profile-skills__empty">
										Пока специальности не добавлены.
										Выберите хотя бы одну, чтобы профиль
										выглядел завершённым.
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
