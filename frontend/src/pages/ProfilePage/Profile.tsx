import {
	formatBudget,
	getProjects,
	proposalStatusLabels,
	statusLabels,
	updateProfileSkills,
	useAuth,
	type ProjectOrder,
} from "@/features";
import { isEmailValid, isPhoneValid } from "@/shared";
import "./Profile.css";
import { useEffect, useState } from "react";
import SkillsAutocomplete from "@/widgets/SkillsAutoComplete/SkillsAutoComplete";
import { NavLink } from "react-router-dom";
import { getAcceptedProject } from "@/features/projects/projectsApi";

type ProfileStats = {
	label: string;
	value: string;
	description: string;
};

type EditableRole = "Freelancer" | "Client";

type ProfileFormState = {
	email: string;
	fullName: string;
	role: EditableRole;
	telegram: string;
	phone: string;
	companyName: string;
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

function makeFormState(
	user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): ProfileFormState {
	return {
		email: user.email ?? "",
		fullName: user.fullName ?? "",
		role: user.role,
		telegram: user.contacts?.telegram ?? "",
		phone: user.contacts?.phone ?? "",
		companyName: "companyName" in user ? user.companyName ?? "" : "",
	};
}

export default function Profile() {
	const { user, logout, updateProfile, refreshAuth } = useAuth();
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const [skillsError, setSkillsError] = useState<string | null>(null);
	const [isSavingSkills, setIsSavingSkills] = useState(false);
	const [profileForm, setProfileForm] = useState<ProfileFormState>({
		email: "",
		fullName: "",
		role: "Freelancer",
		telegram: "",
		phone: "",
		companyName: "",
	});
	const [isEditing, setIsEditing] = useState(false);
	const [profileError, setProfileError] = useState<string | null>(null);
	const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [orders, setOrders] = useState<ProjectOrder[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [ordersError, setOrdersError] = useState<string | null>(null);

	useEffect(() => {
		if (!user) {
			setSelectedSkills([]);
			setProfileForm({
				email: "",
				fullName: "",
				role: "Freelancer",
				telegram: "",
				phone: "",
				companyName: "",
			});
			return;
		}

		setProfileForm(makeFormState(user));
		setSelectedSkills("skills" in user ? user.skills ?? [] : []);
	}, [user]);

	useEffect(() => {
		if (!user) return;

		let active = true;

		const loadOrders = async () => {
			setOrdersLoading(true);
			setOrdersError(null);

			try {
				const items = await getAcceptedProject();
				if (active) {
					setOrders(items);
				}
			} catch {
				if (active) {
					setOrdersError("Не удалось загрузить заказы для профиля");
				}
			} finally {
				if (active) {
					setOrdersLoading(false);
				}
			}
		};

		void loadOrders();

		return () => {
			active = false;
		};
	}, [user]);

	if (!user) {
		return null;
	}

	const normalizedRole = String(user.role).toLowerCase();
	const isFreelancer = normalizedRole === "freelancer";
	const isClient = normalizedRole === "client";
	const previewRole = isEditing ? profileForm.role : user.role;
	const previewIsFreelancer = previewRole === "Freelancer";
	const roleLabel = isClient ? "Заказчик" : "Исполнитель";
	const contacts = user.contacts ?? {};
	const displayName =
		user.fullName?.trim() || user.email?.split("@")[0] || "Пользователь";

	const initials = displayName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

	const acceptedOrders = orders.filter((order) =>
		order.proposals.some(
			(proposal) =>
				proposal.freelancerId === user.id &&
				proposal.status === "accepted",
		),
	);

	const completedOrders = orders.filter(
		(order) =>
			order.selectedFreelancerId === user.id &&
			order.status === "Completed",
	);

	const clientActiveOrders = orders.filter(
		(order) =>
			order.hirerId === user.id &&
			["Published", "Paused", "In_Progress"].includes(order.status),
	);

	const resetEditForm = () => {
		setProfileForm(makeFormState(user));
		setSelectedSkills("skills" in user ? user.skills ?? [] : []);
		setProfileError(null);
		setProfileSuccess(null);
	};

	const handleSkillsChange = async (skills: string[]) => {
		if (!previewIsFreelancer || isSavingSkills) {
			return;
		}

		if (!isFreelancer) {
			setSelectedSkills(skills);
			setSkillsError(null);
			setProfileSuccess(null);
			return;
		}

		const previousSkills = selectedSkills;

		setSelectedSkills(skills);
		setSkillsError(null);
		setProfileSuccess(null);
		setIsSavingSkills(true);

		try {
			await updateProfileSkills(skills);
			await refreshAuth();
		} catch (error) {
			console.error(error);
			setSelectedSkills(previousSkills);
			setSkillsError("Не удалось сохранить специальности");
		} finally {
			setIsSavingSkills(false);
		}
	};

	const handleProfileSubmit = async () => {
		if (isSavingProfile) return;

		if (!profileForm.fullName.trim()) {
			setProfileError("Укажите имя");
			return;
		}

		if (!profileForm.email.trim()) {
			setProfileError("Введите email");
			return;
		}

		if (!isEmailValid(profileForm.email.trim())) {
			setProfileError("Введите корректный email");
			return;
		}

		if (profileForm.phone.trim() && !isPhoneValid(profileForm.phone.trim())) {
			setProfileError("Введите корректный номер телефона");
			return;
		}

		if (!profileForm.telegram.trim() && !profileForm.phone.trim()) {
			setProfileError("Укажите Telegram или телефон");
			return;
		}

		if (
			profileForm.role === "Client" &&
			!profileForm.companyName.trim()
		) {
			setProfileError("Введите название компании");
			return;
		}

		setIsSavingProfile(true);
		setProfileError(null);
		setProfileSuccess(null);

		try {
			await updateProfile({
				email: profileForm.email.trim().toLowerCase(),
				fullName: profileForm.fullName.trim(),
				role: profileForm.role,
				contacts: {
					telegram: profileForm.telegram.trim(),
					phone: profileForm.phone.trim(),
				},
				companyName:
					profileForm.role === "Client"
						? profileForm.companyName.trim()
						: undefined,
				skills:
					profileForm.role === "Freelancer" ? selectedSkills : [],
			});
			setIsEditing(false);
			setProfileSuccess("Профиль обновлён");
		} catch (error) {
			console.error(error);
			setProfileError(
				error instanceof Error
					? error.message
					: "Не удалось сохранить изменения профиля",
			);
		} finally {
			setIsSavingProfile(false);
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
			label: isFreelancer ? "Принятые отклики" : "Активные заказы",
			value: String(
				isFreelancer ? acceptedOrders.length : clientActiveOrders.length,
			),
			description: isFreelancer
				? "Проекты, где заказчик уже выбрал вас исполнителем."
				: "Опубликованные заказы, которые ещё не завершены.",
		},
		{
			label: isFreelancer ? "Завершённые заказы" : "Контакты",
			value: isFreelancer
				? String(completedOrders.length)
				: contacts.telegram || contacts.phone
					? "Заполнены"
					: "Ожидают заполнения",
			description: isFreelancer
				? "Количество заказов, доведённых до статуса завершения."
				: "Чем больше данных, тем легче связаться с вами.",
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
			title: isFreelancer ? "Найти задачу" : "Создать заказ",
			description: isFreelancer
				? "Подберите новый проект под свою экспертизу."
				: "Опубликуйте новый заказ и начните сбор откликов.",
			to: isFreelancer ? "/projects" : "/projects/new",
			label: isFreelancer ? "Смотреть проекты" : "Создать",
		},
	];

	const renderOrderList = (
		items: ProjectOrder[],
		emptyText: string,
		mode: "accepted" | "completed" | "client",
	) => {
		if (ordersLoading) {
			return <p className="profile-list__empty">Загружаем список...</p>;
		}

		if (ordersError) {
			return <p className="profile-list__error">{ordersError}</p>;
		}

		if (!items.length) {
			return <p className="profile-list__empty">{emptyText}</p>;
		}

		return (
			<div className="profile-order-list">
				{items.map((item) => {
					const ownAcceptedProposal = item.proposals.find(
						(proposal) =>
							proposal.freelancerId === user.id &&
							proposal.status === "accepted",
					);

					return (
						<NavLink
							key={item.id}
							to={`/projects/${item.id}`}
							className="profile-order-card"
						>
							<div className="profile-order-card__head">
								<strong>{item.title}</strong>
								<span>{statusLabels[item.status]}</span>
							</div>
							<p>{item.shortDescription}</p>
							<div className="profile-order-card__meta">
								<span>{formatBudget(item)}</span>
								{mode === "accepted" && ownAcceptedProposal ? (
									<span>
										{
											proposalStatusLabels[
												ownAcceptedProposal.status
											]
										}
									</span>
								) : null}
								{mode === "client" ? (
									<span>{item.proposalsCount} откликов</span>
								) : null}
							</div>
						</NavLink>
					);
				})}
			</div>
		);
	};

	return (
		<div className="profile-page">
			<section className="profile-hero">
				<div className="profile-hero__content">
					<div className="profile-identity">
						<div className="profile-avatar" aria-hidden="true">
							{initials || "HM"}
						</div>
						<div className="profile-headline">
							<span className="profile-kicker">Личный кабинет</span>
							<h1>{displayName}</h1>
							<p>
								Управляйте профилем, навыками и своими заказами
								в одном месте.
							</p>
						</div>
					</div>

					<div className="profile-highlight">
						<span className="profile-highlight__label">Основное</span>
						<div className="profile-highlight__row">
							<span>Email</span>
							<strong>{user.email}</strong>
						</div>
						<div className="profile-highlight__row">
							<span>Роль</span>
							<strong>{roleLabel}</strong>
						</div>
						<div className="profile-highlight__row">
							<span>Контакты</span>
							<strong>
								{contacts.telegram || contacts.phone
									? "Заполнены"
									: "Не указаны"}
							</strong>
						</div>
						{isClient ? (
							<div className="profile-highlight__row">
								<span>Компания</span>
								<strong>{profileForm.companyName || "Не указана"}</strong>
							</div>
						) : null}
						<button
							type="button"
							className="profile-edit-toggle"
							onClick={() => {
								if (!isEditing) {
									resetEditForm();
								}
								setIsEditing((value) => !value);
							}}
						>
							{isEditing ? "Закрыть редактирование" : "Редактировать профиль"}
						</button>
					</div>
				</div>
			</section>

			<section className="profile-grid">
				<div className="profile-card profile-card--wide">
					<div className="profile-card__header">
						<h2>Обзор профиля</h2>
						<p>Короткий срез по состоянию аккаунта и рабочей загрузке.</p>
					</div>

					<div className="profile-stats">
						{profileStats.map((stat) => (
							<article key={stat.label} className="profile-stat">
								<span className="profile-stat__label">{stat.label}</span>
								<strong>{stat.value}</strong>
								<p>{stat.description}</p>
							</article>
						))}
					</div>
				</div>

				<div className="profile-card profile-card--compact">
					<div className="profile-card__header">
						<h2>Контакты</h2>
						<p>Данные, по которым с вами удобно связаться.</p>
					</div>

					<div className="profile-info-list">
						<div className="profile-info-row">
							<span>Telegram</span>
							<strong>{contacts.telegram || "Не указан"}</strong>
						</div>
						<div className="profile-info-row">
							<span>Телефон</span>
							<strong>{contacts.phone || "Не указан"}</strong>
						</div>
					</div>
				</div>

				<div className="profile-card profile-card--compact">
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

				{isEditing ? (
					<div className="profile-card profile-card--wide profile-card--edit">
						<div className="profile-card__header">
							<h2>Редактирование профиля</h2>
							<p>
								Можно менять все данные профиля, кроме пароля.
							</p>
						</div>

						<div className="profile-edit-form">
							<div className="profile-edit-grid">
								<label>
									<span>Email</span>
									<input
										value={profileForm.email}
										disabled={isSavingProfile}
										onChange={(event) =>
											setProfileForm((current) => ({
												...current,
												email: event.target.value,
											}))
										}
									/>
								</label>
								<label>
									<span>Имя</span>
									<input
										value={profileForm.fullName}
										disabled={isSavingProfile}
										onChange={(event) =>
											setProfileForm((current) => ({
												...current,
												fullName: event.target.value,
											}))
										}
									/>
								</label>
								<label>
									<span>Роль</span>
									<select
										value={profileForm.role}
										disabled={isSavingProfile}
										onChange={(event) =>
											setProfileForm((current) => ({
												...current,
												role: event.target.value as EditableRole,
											}))
										}
									>
										<option value="Freelancer">Исполнитель</option>
										<option value="Client">Заказчик</option>
									</select>
								</label>
								<label>
									<span>Telegram</span>
									<input
										value={profileForm.telegram}
										disabled={isSavingProfile}
										onChange={(event) =>
											setProfileForm((current) => ({
												...current,
												telegram: event.target.value,
											}))
										}
									/>
								</label>
								<label>
									<span>Телефон</span>
									<input
										value={profileForm.phone}
										disabled={isSavingProfile}
										onChange={(event) =>
											setProfileForm((current) => ({
												...current,
												phone: event.target.value,
											}))
										}
									/>
								</label>
								{profileForm.role === "Client" ? (
									<label>
										<span>Компания</span>
										<input
											value={profileForm.companyName}
											disabled={isSavingProfile}
											onChange={(event) =>
												setProfileForm((current) => ({
													...current,
													companyName: event.target.value,
												}))
											}
										/>
									</label>
								) : null}
							</div>
							<div className="profile-edit-actions">
								<button
									type="button"
									disabled={isSavingProfile}
									onClick={() => void handleProfileSubmit()}
								>
									{isSavingProfile ? "Сохраняем..." : "Сохранить"}
								</button>
								<button
									type="button"
									disabled={isSavingProfile}
									onClick={() => {
										resetEditForm();
										setIsEditing(false);
									}}
								>
									Отменить
								</button>
							</div>
							{profileError ? (
								<p className="profile-list__error">{profileError}</p>
							) : null}
						</div>
					</div>
				) : null}

				{previewIsFreelancer ? (
					<div className="profile-card profile-card--skills">
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
								{isSavingSkills ? (
									<p className="profile-skills__saving">Сохраняем...</p>
								) : null}
								{skillsError ? (
									<p className="profile-skills__error">{skillsError}</p>
								) : null}
							</div>

							<div className="profile-skills__summary">
								<span className="profile-skills__label">
									В профиле отображаются
								</span>
								{selectedSkills.length > 0 ? (
									<div className="profile-specialties">
										{selectedSkills.map((skill) => (
											<span key={skill} className="profile-specialty">
												{skill}
											</span>
										))}
									</div>
								) : (
									<p className="profile-skills__empty">
										Пока специальности не добавлены.
									</p>
								)}
							</div>
						</div>
					</div>
				) : null}

				{isFreelancer ? (
					<div className="profile-card profile-card--side">
						<div className="profile-card__header">
							<h2>Принятые отклики</h2>
							<p>Заказы, где ваш отклик уже приняли.</p>
						</div>
						{renderOrderList(
							acceptedOrders,
							"Пока нет заказов с принятым откликом.",
							"accepted",
						)}
					</div>
				) : null}

				{isFreelancer ? (
					<div className="profile-card profile-card--side">
						<div className="profile-card__header">
							<h2>Сделанные заказы</h2>
							<p>Проекты, которые вы уже завершили как исполнитель.</p>
						</div>
						{renderOrderList(
							completedOrders,
							"Пока нет завершённых заказов.",
							"completed",
						)}
					</div>
				) : null}

				{isClient ? (
					<div className="profile-card profile-card--wide">
						<div className="profile-card__header">
							<h2>Опубликованные и не выполненные заказы</h2>
							<p>Все активные заказы, которые ещё находятся в работе.</p>
						</div>
						{renderOrderList(
							clientActiveOrders,
							"Сейчас нет активных заказов.",
							"client",
						)}
					</div>
				) : null}

				{profileSuccess && !isEditing ? (
					<div className="profile-card profile-card--wide profile-card--message">
						<p className="profile-list__success">{profileSuccess}</p>
					</div>
				) : null}
			</section>
		</div>
	);
}
