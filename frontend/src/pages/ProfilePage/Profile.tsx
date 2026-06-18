import {
	formatBudget,
	proposalStatusLabels,
	statusLabels,
	updateProfileSkills,
	useAuth,
	type Currency,
	type ProjectOrder,
} from "@/features";
import { apiRequest, isEmailValid, isPhoneValid } from "@/shared";
import { projectSkillOptions } from "@/shared/skillOptions";
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

type TelegramConnectLinkResponse = {
	connectUrl: string;
	expiresAtUtc: string;
};

type EditableRole = "Freelancer" | "Client" | "Admin";

type ProfileFormState = {
	email: string;
	fullName: string;
	role: EditableRole;
	telegram: string;
	phone: string;
	companyName: string;
	hourlyRate: string;
	currency: Currency;
};

const profileCurrencies: Currency[] = ["RUB", "USD", "EUR"];

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
		hourlyRate:
			"hourlyRate" in user && user.hourlyRate != null
				? String(user.hourlyRate)
				: "",
		currency:
			"currency" in user && user.currency != null ? user.currency : "RUB",
	};
}

export default function Profile() {
	const { user, logout, updateProfile, refreshAuth, replaceUser } = useAuth();
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
		hourlyRate: "",
		currency: "RUB",
	});
	const [isEditing, setIsEditing] = useState(false);
	const [profileError, setProfileError] = useState<string | null>(null);
	const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [orders, setOrders] = useState<ProjectOrder[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [ordersError, setOrdersError] = useState<string | null>(null);
	const [telegramError, setTelegramError] = useState<string | null>(null);
	const [telegramInfo, setTelegramInfo] = useState<string | null>(null);
	const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
	const [isWaitingForTelegram, setIsWaitingForTelegram] = useState(false);
	const isTelegramConnected = user?.isTelegramConnected ?? false;

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
				hourlyRate: "",
				currency: "RUB",
			});
			return;
		}

		setProfileForm(makeFormState(user));
		setSelectedSkills("skills" in user ? user.skills ?? [] : []);
	}, [user]);

	useEffect(() => {
		if (!isWaitingForTelegram || isTelegramConnected) {
			return;
		}

		const refreshInterval = window.setInterval(() => {
			void refreshAuth();
		}, 5000);

		const timeout = window.setTimeout(() => {
			setIsWaitingForTelegram(false);
			setTelegramInfo(
				"Ссылка на подключение уже выдана. Если вы нажали Start в боте, просто обновите страницу или попробуйте снова.",
			);
		}, 120000);

		return () => {
			window.clearInterval(refreshInterval);
			window.clearTimeout(timeout);
		};
	}, [isTelegramConnected, isWaitingForTelegram, refreshAuth]);

	useEffect(() => {
		if (!isTelegramConnected) {
			return;
		}

		if (isWaitingForTelegram) {
			setIsWaitingForTelegram(false);
		}

		setTelegramError(null);
		setTelegramInfo("Telegram подключён. Следующие уведомления будут приходить в бота.");
	}, [isTelegramConnected, isWaitingForTelegram]);

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
	const isAdmin = normalizedRole === "admin";
	const previewRole = isEditing ? profileForm.role : user.role;
	const previewIsFreelancer = previewRole === "Freelancer";
	const roleLabel = isAdmin
		? "Администратор"
		: isClient
			? "Заказчик"
			: "Исполнитель";
	const contacts = user.contacts ?? {};
	const userRating = Number.isFinite(user.rating) ? user.rating : 0;
	const freelancerHourlyRate =
		isFreelancer && "hourlyRate" in user ? user.hourlyRate : null;
	const freelancerCurrency =
		isFreelancer && "currency" in user ? user.currency : null;
	const displayName =
		user.fullName?.trim() || user.email?.split("@")[0] || "Пользователь";
	const initials = displayName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

	const isCompletedOrder = (order: ProjectOrder) =>
		order.status === "Completed" || order.completedAt !== null;

	const freelancerOrders = orders.filter(
		(order) => order.selectedFreelancerId === user.id,
	);

	const acceptedOrders = freelancerOrders.filter(
		(order) =>
			!isCompletedOrder(order) &&
			order.status !== "Cancelled" &&
			order.status !== "Archived" &&
			order.proposals.some(
				(proposal) =>
					proposal.freelancerId === user.id &&
					proposal.status === "accepted",
			),
	);

	const unratedCompletedOrders = freelancerOrders.filter(
		(order) =>
			isCompletedOrder(order) && order.clientRatingByFreelancer === null,
	);

	const completedOrders = freelancerOrders.filter(
		(order) =>
			isCompletedOrder(order) && order.clientRatingByFreelancer !== null,
	);
	const freelancerCompletedOrders =
		isFreelancer && "completedOrders" in user && user.completedOrders != null
			? Math.max(
					user.completedOrders,
					completedOrders.length + unratedCompletedOrders.length,
				)
			: completedOrders.length + unratedCompletedOrders.length;

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
			if ("skills" in user) {
				replaceUser({
					...user,
					skills,
				});
			}
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

		if (profileForm.role === "Freelancer") {
			const hourlyRate =
				profileForm.hourlyRate.trim() === ""
					? 0
					: Number(profileForm.hourlyRate);

			if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
				setProfileError("Введите корректную почасовую ставку");
				return;
			}
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
				hourlyRate:
					profileForm.role === "Freelancer"
						? Number(profileForm.hourlyRate || 0)
						: undefined,
				currency:
					profileForm.role === "Freelancer"
						? profileForm.currency
						: undefined,
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

	const handleTelegramConnect = async () => {
		if (isConnectingTelegram) {
			return;
		}

		setIsConnectingTelegram(true);
		setTelegramError(null);
		setTelegramInfo(null);

		try {
			const response = await apiRequest<TelegramConnectLinkResponse>(
				"/profile/telegram/connect-link",
				{
					method: "POST",
				},
			);

			const popup = window.open(
				response.connectUrl,
				"_blank",
				"noopener,noreferrer",
			);

			if (!popup) {
				window.location.assign(response.connectUrl);
			}

			setIsWaitingForTelegram(true);
			setTelegramInfo(
				"Бот открыт. Нажмите Start в Telegram, а мы периодически обновим статус подключения здесь.",
			);
		} catch (error) {
			console.error(error);
			setTelegramError(
				error instanceof Error
					? error.message
					: "Не удалось создать ссылку для подключения Telegram",
			);
		} finally {
			setIsConnectingTelegram(false);
		}
	};

	const profileStats: ProfileStats[] = [
		{
			label: "Рейтинг",
			value: `${userRating.toFixed(1)} / 5`,
			description: "Средняя оценка по завершённым заказам на платформе.",
		},
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
			label: isAdmin
				? "Заказов в системе"
				: isFreelancer
					? "Принятые отклики"
					: "Активные заказы",
			value: String(
				isAdmin
					? orders.length
					: isFreelancer
						? acceptedOrders.length
						: clientActiveOrders.length,
			),
			description: isAdmin
				? "Все заказы, которые вы можете контролировать через платформу."
				: isFreelancer
					? "Проекты, где заказчик уже выбрал вас исполнителем."
					: "Опубликованные заказы, которые ещё не завершены.",
		},
		{
			label: isAdmin ? "Доступ" : isFreelancer ? "Завершённые заказы" : "Контакты",
			value: isAdmin
				? "Полный"
				: isFreelancer
					? String(freelancerCompletedOrders)
					: contacts.telegram || contacts.phone
						? "Заполнены"
						: "Ожидают заполнения",
			description: isAdmin
				? "Админ может открывать профиль, фрилансеров, заказы и админ-панель."
				: isFreelancer
					? "Количество заказов, которые были завершены исполнителем."
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
			title: isAdmin
				? "Открыть админ-панель"
				: isFreelancer
					? "Найти задачу"
					: "Создать заказ",
			description: isAdmin
				? "Управляйте пользователями и заказами в одном месте."
				: isFreelancer
					? "Подберите новый проект под свою экспертизу."
					: "Опубликуйте новый заказ и начните сбор откликов.",
			to: isAdmin ? "/admin" : isFreelancer ? "/projects" : "/projects/new",
			label: isAdmin ? "Открыть" : isFreelancer ? "Смотреть проекты" : "Создать",
		},
	];

	const renderOrderList = (
		items: ProjectOrder[],
		emptyText: string,
		mode: "accepted" | "completed" | "client" | "pending-rating",
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
								{mode === "pending-rating" ? (
									<span>Нужно оценить заказчика</span>
								) : null}
								{mode === "completed" ? (
									<span>Оценка оставлена</span>
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
							<span>Рейтинг</span>
							<strong>{userRating.toFixed(1)} / 5</strong>
						</div>
						<div className="profile-highlight__row">
							<span>Контакты</span>
							<strong>
								{contacts.telegram || contacts.phone
									? "Заполнены"
									: "Не указаны"}
							</strong>
						</div>
						<div className="profile-highlight__row">
							<span>Telegram-бот</span>
							<strong>
								{isTelegramConnected
									? "Подключён"
									: "Не подключён"}
							</strong>
						</div>
						{isClient ? (
							<div className="profile-highlight__row">
								<span>Компания</span>
								<strong>{profileForm.companyName || "Не указана"}</strong>
							</div>
						) : isFreelancer ? (
							<>
								<div className="profile-highlight__row">
									<span>Ставка</span>
									<strong>
										{typeof freelancerHourlyRate === "number"
											? `${freelancerHourlyRate} ${freelancerCurrency ?? "RUB"}/ч`
											: "Не указана"}
									</strong>
								</div>
								<div className="profile-highlight__row">
									<span>Сделанные заказы</span>
									<strong>{freelancerCompletedOrders}</strong>
								</div>
							</>
						) : (
							<>
								<div className="profile-highlight__row">
									<span>Доступ</span>
									<strong>Полный</strong>
								</div>
								<div className="profile-highlight__row">
									<span>Панель</span>
									<strong>/admin</strong>
								</div>
							</>
						)}
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

					<div className="profile-telegram-connect">
						<div className="profile-telegram-connect__status">
							<span>Статус Telegram</span>
							<strong
								className={
									isTelegramConnected
										? "profile-telegram-badge profile-telegram-badge--connected"
										: "profile-telegram-badge"
								}
							>
								{isTelegramConnected ? "Подключён" : "Ожидает подключения"}
							</strong>
						</div>
						<button
							type="button"
							className="profile-telegram-connect__button"
							disabled={isConnectingTelegram}
							onClick={() => void handleTelegramConnect()}
						>
							{isConnectingTelegram
								? "Готовим ссылку..."
								: isWaitingForTelegram
									? "Ожидаем подтверждение..."
									: isTelegramConnected
										? "Переподключить Telegram"
										: "Подключить Telegram"}
						</button>
						<p className="profile-telegram-connect__hint">
							Чтобы получать уведомления в Telegram, нужно будет
							написать боту и нажать Start. Ссылку на бота
							мы откроем автоматически после нажатия кнопки.
						</p>
						{telegramInfo ? (
							<p className="profile-list__success">{telegramInfo}</p>
						) : null}
						{telegramError ? (
							<p className="profile-list__error">{telegramError}</p>
						) : null}
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
										<option value="Admin">Администратор</option>
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
								) : (
									<>
										<label>
											<span>Почасовая ставка</span>
											<input
												value={profileForm.hourlyRate}
												disabled={isSavingProfile}
												inputMode="decimal"
												onChange={(event) =>
													setProfileForm((current) => ({
														...current,
														hourlyRate: event.target.value,
													}))
												}
											/>
										</label>
										<label>
											<span>Валюта</span>
											<select
												value={profileForm.currency}
												disabled={isSavingProfile}
												onChange={(event) =>
													setProfileForm((current) => ({
														...current,
														currency: event.target.value as Currency,
													}))
												}
											>
												{profileCurrencies.map((currency) => (
													<option key={currency} value={currency}>
														{currency}
													</option>
												))}
											</select>
										</label>
									</>
								)}
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
									options={[...projectSkillOptions]}
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
							<h2>Ждут вашу оценку</h2>
							<p>
								Завершённые проекты, где вы ещё не оценили
								заказчика.
							</p>
						</div>
						{renderOrderList(
							unratedCompletedOrders,
							"Сейчас нет завершённых заказов без вашей оценки.",
							"pending-rating",
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
