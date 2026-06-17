import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
	banAdminUserRequest,
	deleteAdminOrderRequest,
	deleteAdminUserRequest,
	formatBudget,
	getAdminOrders,
	getAdminUsers,
	promoteUserToAdminRequest,
	requestAdminUserEmailChangeRequest,
	statusLabels,
	updateAdminOrderRequest,
	updateAdminUserRequest,
	useAuth,
	type AdminOrderUpdateInput,
	type AdminUserRecord,
	type AdminUserUpdateInput,
	type ProjectOrder,
} from "@/features";
import type { UserRole } from "@/features/Auth/getMe.types";
import { ApiError, isEmailValid, isPhoneValid } from "@/shared";
import { PageState } from "@/widgets";
import "./Admin.css";

type AdminView = "users" | "orders";
type UserRoleFilter = "all" | UserRole;
type OrderStatusFilter = "all" | ProjectOrder["status"];

type UserEditorState = {
	fullName: string;
	email: string;
	role: UserRole;
	telegram: string;
	phone: string;
	companyName: string;
};

type OrderEditorState = {
	title: string;
	rawDescription: string;
	companyName: string;
	category: string;
	status: ProjectOrder["status"];
	budgetMin: string;
	budgetMax: string;
	currency: ProjectOrder["currency"];
	budgetType: ProjectOrder["budgetType"];
	skills: string;
};

const categoryOptions = [
	"Разработка",
	"Мобильная разработка",
	"Дизайн",
	"Маркетинг",
	"Контент",
] as const;

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof ApiError) return error.message;
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

function getRoleLabel(role: UserRole) {
	if (role === "Admin") return "Администратор";
	if (role === "Client") return "Заказчик";
	return "Фрилансер";
}

function makeUserEditorState(record: AdminUserRecord): UserEditorState {
	return {
		fullName: record.fullName,
		email: record.email,
		role: record.role,
		telegram: record.telegram,
		phone: record.phone,
		companyName: record.companyName,
	};
}

function makeOrderEditorState(order: ProjectOrder): OrderEditorState {
	return {
		title: order.title,
		rawDescription: order.rawDescription,
		companyName: order.companyName,
		category: order.category,
		status: order.status,
		budgetMin: String(order.budgetMin),
		budgetMax: String(order.budgetMax),
		currency: order.currency,
		budgetType: order.budgetType,
		skills: order.skills.join(", "),
	};
}

function parseSkills(value: string) {
	return Array.from(
		new Set(
			value
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean),
		),
	);
}

function normalizeEmail(value: string) {
	return value.trim().toLowerCase();
}

export default function Admin() {
	const { user } = useAuth();
	const [users, setUsers] = useState<AdminUserRecord[]>([]);
	const [orders, setOrders] = useState<ProjectOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [actionError, setActionError] = useState("");
	const [activeView, setActiveView] = useState<AdminView>("users");
	const [userQuery, setUserQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
	const [orderQuery, setOrderQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [userEditor, setUserEditor] = useState<UserEditorState | null>(null);
	const [orderEditor, setOrderEditor] = useState<OrderEditorState | null>(
		null,
	);
	const [pendingUserId, setPendingUserId] = useState<number | null>(null);
	const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

	const loadDashboard = useCallback(async () => {
		setLoading(true);
		setError("");
		setActionError("");

		try {
			const [usersItems, orderItems] = await Promise.all([
				getAdminUsers(),
				getAdminOrders(),
			]);

			setUsers(usersItems);
			setOrders(orderItems);
		} catch (loadError) {
			setError(
				getErrorMessage(loadError, "Не удалось загрузить админ-панель"),
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadDashboard();
	}, [loadDashboard]);

	const relatedOrdersMap = useMemo(() => {
		const counts = new Map<number, number>();

		orders.forEach((order) => {
			counts.set(order.hirerId, (counts.get(order.hirerId) ?? 0) + 1);

			const relatedFreelancers = new Set<number>();
			if (order.selectedFreelancerId) {
				relatedFreelancers.add(order.selectedFreelancerId);
			}

			order.proposals.forEach((proposal) => {
				relatedFreelancers.add(proposal.freelancerId);
			});

			relatedFreelancers.forEach((freelancerId) => {
				counts.set(freelancerId, (counts.get(freelancerId) ?? 0) + 1);
			});
		});

		return counts;
	}, [orders]);

	const filteredUsers = useMemo(() => {
		const normalizedQuery = userQuery.trim().toLowerCase();

		return users.filter((record) => {
			const matchesRole =
				roleFilter === "all" || record.role === roleFilter;
			const matchesQuery =
				!normalizedQuery ||
				record.fullName.toLowerCase().includes(normalizedQuery) ||
				record.email.toLowerCase().includes(normalizedQuery) ||
				record.companyName.toLowerCase().includes(normalizedQuery);

			return matchesRole && matchesQuery;
		});
	}, [roleFilter, userQuery, users]);

	const filteredOrders = useMemo(() => {
		const normalizedQuery = orderQuery.trim().toLowerCase();

		return orders.filter((order) => {
			const matchesStatus =
				statusFilter === "all" || order.status === statusFilter;
			const matchesQuery =
				!normalizedQuery ||
				order.title.toLowerCase().includes(normalizedQuery) ||
				order.hirerName.toLowerCase().includes(normalizedQuery) ||
				order.companyName.toLowerCase().includes(normalizedQuery);

			return matchesStatus && matchesQuery;
		});
	}, [orderQuery, orders, statusFilter]);

	useEffect(() => {
		if (activeView !== "users") {
			return;
		}

		if (filteredUsers.length === 0) {
			setSelectedUserId(null);
			return;
		}

		if (!filteredUsers.some((record) => record.id === selectedUserId)) {
			setSelectedUserId(filteredUsers[0].id);
		}
	}, [activeView, filteredUsers, selectedUserId]);

	useEffect(() => {
		if (activeView !== "orders") {
			return;
		}

		if (filteredOrders.length === 0) {
			setSelectedOrderId(null);
			return;
		}

		if (!filteredOrders.some((order) => order.id === selectedOrderId)) {
			setSelectedOrderId(filteredOrders[0].id);
		}
	}, [activeView, filteredOrders, selectedOrderId]);

	const selectedUser =
		filteredUsers.find((record) => record.id === selectedUserId) ?? null;
	const selectedOrder =
		filteredOrders.find((order) => order.id === selectedOrderId) ?? null;

	useEffect(() => {
		setUserEditor(selectedUser ? makeUserEditorState(selectedUser) : null);
	}, [selectedUser]);

	useEffect(() => {
		setOrderEditor(
			selectedOrder ? makeOrderEditorState(selectedOrder) : null,
		);
	}, [selectedOrder]);

	const adminCount = users.filter((record) => record.role === "Admin").length;
	const bannedCount = users.filter((record) => record.isBanned).length;
	const activeOrdersCount = orders.filter(
		(order) =>
			order.status !== "Completed" &&
			order.status !== "Cancelled" &&
			order.status !== "Archived",
	).length;
	const isSelectedSelf = selectedUser?.id === user?.id;

	const saveUser = async () => {
		if (!selectedUser || !userEditor) {
			return;
		}

		if (!userEditor.fullName.trim()) {
			setActionError("Укажите имя пользователя.");
			setNotice("");
			return;
		}

		if (!userEditor.email.trim()) {
			setActionError("Укажите email пользователя.");
			setNotice("");
			return;
		}

		if (!isEmailValid(userEditor.email.trim())) {
			setActionError("Введите корректный email пользователя.");
			setNotice("");
			return;
		}

		if (userEditor.phone.trim() && !isPhoneValid(userEditor.phone.trim())) {
			setActionError("Введите корректный номер телефона.");
			setNotice("");
			return;
		}

		if (userEditor.role === "Client" && !userEditor.companyName.trim()) {
			setActionError("Для заказчика нужно указать компанию.");
			setNotice("");
			return;
		}

		setPendingUserId(selectedUser.id);
		setActionError("");
		setNotice("");

		const emailChanged =
			normalizeEmail(userEditor.email) !==
			normalizeEmail(selectedUser.email);

		const payload: AdminUserUpdateInput = {
			fullName: userEditor.fullName,
			email: emailChanged ? selectedUser.email : userEditor.email,
			role: userEditor.role,
			telegram: userEditor.telegram,
			phone: userEditor.phone,
			companyName: userEditor.companyName,
		};

		try {
			const nextUser = await updateAdminUserRequest(
				selectedUser,
				payload,
			);
			setUsers((current) =>
				current.map((item) =>
					item.id === nextUser.id ? nextUser : item,
				),
			);

			if (emailChanged) {
				try {
					const emailChangeResult =
						await requestAdminUserEmailChangeRequest(
							selectedUser.id,
							userEditor.email,
						);
					setUsers((current) =>
						current.map((item) =>
							item.id === emailChangeResult.user.id
								? emailChangeResult.user
								: item,
						),
					);
					setNotice(emailChangeResult.message);
				} catch (emailChangeError) {
					setNotice(`Пользователь ${nextUser.fullName} обновлён.`);
					setActionError(
						`Основные данные сохранены, но смену email запустить не удалось: ${getErrorMessage(
							emailChangeError,
							"Не удалось отправить код подтверждения",
						)}`,
					);
				}

				return;
			}

			setNotice(`Пользователь ${nextUser.fullName} обновлён.`);
		} catch (saveError) {
			setActionError(
				getErrorMessage(saveError, "Не удалось обновить пользователя"),
			);
		} finally {
			setPendingUserId(null);
		}
	};

	const promoteToAdmin = async () => {
		if (!selectedUser || selectedUser.role === "Admin") {
			return;
		}

		setPendingUserId(selectedUser.id);
		setActionError("");
		setNotice("");

		try {
			const nextUser = await promoteUserToAdminRequest(selectedUser.id);
			setUsers((current) =>
				current.map((item) =>
					item.id === nextUser.id ? nextUser : item,
				),
			);
			setNotice(
				`Пользователь ${nextUser.fullName} теперь администратор.`,
			);
		} catch (saveError) {
			setActionError(
				getErrorMessage(
					saveError,
					"Не удалось выдать административные права",
				),
			);
		} finally {
			setPendingUserId(null);
		}
	};

	const toggleBan = async () => {
		if (!selectedUser) {
			return;
		}

		if (selectedUser.role === "Admin") {
			setActionError(
				"Администраторы не могут банить другого администратора",
			);
			setNotice("");
			return;
		}

		if (isSelectedSelf) {
			setActionError("Текущего администратора нельзя забанить.");
			setNotice("");
			return;
		}

		setPendingUserId(selectedUser.id);
		setActionError("");
		setNotice("");

		try {
			const nextUser = await banAdminUserRequest(
				selectedUser.id,
				!selectedUser.isBanned,
			);
			setUsers((current) =>
				current.map((item) =>
					item.id === nextUser.id ? nextUser : item,
				),
			);
			setNotice(
				nextUser.isBanned
					? `Пользователь ${nextUser.fullName} забанен.`
					: `Пользователь ${nextUser.fullName} разбанен.`,
			);
		} catch (saveError) {
			setActionError(
				getErrorMessage(
					saveError,
					"Не удалось изменить статус пользователя",
				),
			);
		} finally {
			setPendingUserId(null);
		}
	};

	const deleteUser = async () => {
		if (!selectedUser) {
			return;
		}

		if (isSelectedSelf) {
			setActionError("Текущего администратора нельзя удалить.");
			setNotice("");
			return;
		}

		if (
			!window.confirm(`Удалить пользователя «${selectedUser.fullName}»?`)
		) {
			return;
		}

		const relatedOrderIds = orders
			.filter(
				(order) =>
					order.hirerId === selectedUser.id ||
					order.selectedFreelancerId === selectedUser.id ||
					order.proposals.some(
						(proposal) => proposal.freelancerId === selectedUser.id,
					),
			)
			.map((order) => order.id);

		setPendingUserId(selectedUser.id);
		setActionError("");
		setNotice("");

		try {
			const response = await deleteAdminUserRequest(selectedUser.id);
			setUsers((current) =>
				current.filter((item) => item.id !== selectedUser.id),
			);
			setOrders((current) =>
				current.filter((order) => !relatedOrderIds.includes(order.id)),
			);
			setNotice(
				response.message ||
					`Пользователь ${selectedUser.fullName} удалён.`,
			);
		} catch (saveError) {
			setActionError(
				getErrorMessage(saveError, "Не удалось удалить пользователя"),
			);
		} finally {
			setPendingUserId(null);
		}
	};

	const saveOrder = async () => {
		if (!selectedOrder || !orderEditor) {
			return;
		}

		if (!orderEditor.title.trim()) {
			setActionError("Укажите название заказа.");
			setNotice("");
			return;
		}

		if (!orderEditor.rawDescription.trim()) {
			setActionError("Укажите описание заказа.");
			setNotice("");
			return;
		}

		const budgetMin = Number(orderEditor.budgetMin);
		const budgetMax = Number(orderEditor.budgetMax);

		if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax)) {
			setActionError("Бюджет должен быть числом.");
			setNotice("");
			return;
		}

		if (budgetMin < 0 || budgetMax < 0 || budgetMin > budgetMax) {
			setActionError("Проверьте границы бюджета.");
			setNotice("");
			return;
		}

		setPendingOrderId(selectedOrder.id);
		setActionError("");
		setNotice("");

		const payload: AdminOrderUpdateInput = {
			title: orderEditor.title,
			rawDescription: orderEditor.rawDescription,
			companyName: orderEditor.companyName,
			category: orderEditor.category,
			status: orderEditor.status,
			budgetMin,
			budgetMax,
			currency: orderEditor.currency,
			budgetType: orderEditor.budgetType,
			skills: parseSkills(orderEditor.skills),
		};

		try {
			const nextOrder = await updateAdminOrderRequest(
				selectedOrder,
				payload,
			);
			setOrders((current) =>
				current.map((item) =>
					item.id === nextOrder.id ? nextOrder : item,
				),
			);
			setNotice(`Заказ «${nextOrder.title}» обновлён.`);
		} catch (saveError) {
			setActionError(
				getErrorMessage(saveError, "Не удалось обновить заказ"),
			);
		} finally {
			setPendingOrderId(null);
		}
	};

	const deleteOrder = async () => {
		if (!selectedOrder) {
			return;
		}

		if (!window.confirm(`Удалить заказ «${selectedOrder.title}»?`)) {
			return;
		}

		setPendingOrderId(selectedOrder.id);
		setActionError("");
		setNotice("");

		try {
			const response = await deleteAdminOrderRequest(selectedOrder.id);
			setOrders((current) =>
				current.filter((item) => item.id !== selectedOrder.id),
			);
			setNotice(
				response.message || `Заказ «${selectedOrder.title}» удалён.`,
			);
		} catch (saveError) {
			setActionError(
				getErrorMessage(saveError, "Не удалось удалить заказ"),
			);
		} finally {
			setPendingOrderId(null);
		}
	};

	if (loading) {
		return (
			<main className="admin-page">
				<PageState
					variant="loading"
					title="Загружаем админ-панель"
					text="Собираем пользователей, заказы и статусы платформы."
				/>
			</main>
		);
	}

	if (error) {
		return (
			<main className="admin-page">
				<PageState
					variant="error"
					title="Не удалось открыть админ-панель"
					text={error}
					action="Повторить"
					onAction={() => void loadDashboard()}
				/>
			</main>
		);
	}

	return (
		<main className="admin-page">
			<section className="admin-hero">
				<div className="admin-hero__copy">
					<span className="admin-kicker">Админ-панель</span>
					<h1>Управление платформой без лишних переходов</h1>
					<p>
						Переключайтесь между пользователями и заказами,
						редактируйте нужные поля и выполняйте административные
						действия из одного рабочего экрана.
					</p>

					<div className="admin-hero__actions">
						<NavLink to="/projects" className="admin-button">
							Каталог заказов
						</NavLink>
						<NavLink
							to="/freelancers"
							className="admin-button admin-button--ghost"
						>
							Фрилансеры
						</NavLink>
						<NavLink
							to="/profile"
							className="admin-button admin-button--ghost"
						>
							Профиль
						</NavLink>
					</div>
				</div>

				<div className="admin-metrics">
					<article className="admin-metric">
						<span>Пользователи</span>
						<strong>{users.length}</strong>
						<p>Все записи, доступные для администрирования.</p>
					</article>
					<article className="admin-metric">
						<span>Администраторы</span>
						<strong>{adminCount}</strong>
						<p>Пользователи с расширенным доступом к платформе.</p>
					</article>
					<article className="admin-metric">
						<span>Баны</span>
						<strong>{bannedCount}</strong>
						<p>Аккаунты с ограничением доступа.</p>
					</article>
					<article className="admin-metric">
						<span>Активные заказы</span>
						<strong>{activeOrdersCount}</strong>
						<p>
							Проекты, которые ещё не завершены и не архивированы.
						</p>
					</article>
				</div>
			</section>

			<section className="admin-switcher">
				<button
					type="button"
					className={`admin-switcher__button ${
						activeView === "users"
							? "admin-switcher__button--active"
							: ""
					}`}
					onClick={() => setActiveView("users")}
				>
					Пользователи
				</button>
				<button
					type="button"
					className={`admin-switcher__button ${
						activeView === "orders"
							? "admin-switcher__button--active"
							: ""
					}`}
					onClick={() => setActiveView("orders")}
				>
					Заказы
				</button>
			</section>

			{actionError ? (
				<p className="admin-notice admin-notice--error">
					{actionError}
				</p>
			) : null}
			{notice ? <p className="admin-notice">{notice}</p> : null}

			{activeView === "users" ? (
				<section className="admin-workspace">
					<div className="admin-column">
						<div className="admin-section__head">
							<div>
								<h2>Пользователи</h2>
								<p>
									Редактирование основных полей, бан, удаление
									и выдача административных прав.
								</p>
							</div>
							<span>{filteredUsers.length} записей</span>
						</div>

						<div className="admin-toolbar">
							<input
								value={userQuery}
								onChange={(event) =>
									setUserQuery(event.target.value)
								}
								placeholder="Поиск по имени, email или компании"
							/>
							<select
								value={roleFilter}
								onChange={(event) =>
									setRoleFilter(
										event.target.value as UserRoleFilter,
									)
								}
							>
								<option value="all">Все роли</option>
								<option value="Admin">Администраторы</option>
								<option value="Client">Заказчики</option>
								<option value="Freelancer">Фрилансеры</option>
							</select>
						</div>

						{filteredUsers.length === 0 ? (
							<PageState
								variant="empty"
								title="Пользователи не найдены"
								text="Попробуйте изменить фильтры поиска."
							/>
						) : (
							<div className="admin-list">
								{filteredUsers.map((record) => (
									<button
										key={record.id}
										type="button"
										className={`admin-list-card ${
											record.id === selectedUserId
												? "admin-list-card--active"
												: ""
										}`}
										onClick={() =>
											setSelectedUserId(record.id)
										}
									>
										<div className="admin-list-card__head">
											<div>
												<strong>
													{record.fullName}
												</strong>
												<p>{record.email}</p>
											</div>
											<span
												className={`admin-badge admin-badge--${record.role.toLowerCase()}`}
											>
												{getRoleLabel(record.role)}
											</span>
										</div>

										<div className="admin-list-card__meta">
											<span>
												{relatedOrdersMap.get(
													record.id,
												) ?? 0}{" "}
												заказов
											</span>
											<span>
												{record.companyName ||
													"Без компании"}
											</span>
										</div>

										<div className="admin-chip-row">
											<span
												className={`admin-chip ${
													record.isOnline
														? "admin-chip--online"
														: ""
												}`}
											>
												{record.isOnline
													? "В сети"
													: "Не в сети"}
											</span>
											{record.pendingEmail ? (
												<span className="admin-chip">
													Ждёт email-подтверждения
												</span>
											) : null}
											{record.isBanned ? (
												<span className="admin-chip admin-chip--danger">
													Забанен
												</span>
											) : null}
										</div>
									</button>
								))}
							</div>
						)}
					</div>

					<div className="admin-panel">
						{selectedUser && userEditor ? (
							<form
								className="admin-form"
								onSubmit={(event) => {
									event.preventDefault();
									void saveUser();
								}}
							>
								<div className="admin-panel__head">
									<div>
										<h2>{selectedUser.fullName}</h2>
										<p>
											{selectedUser.isBanned
												? "Аккаунт сейчас забанен."
												: "Редактируйте базовые данные пользователя."}
										</p>
									</div>
									<div className="admin-chip-row">
										<span
											className={`admin-badge admin-badge--${selectedUser.role.toLowerCase()}`}
										>
											{getRoleLabel(selectedUser.role)}
										</span>
										{selectedUser.isBanned ? (
											<span className="admin-chip admin-chip--danger">
												Бан
											</span>
										) : null}
									</div>
								</div>

								<div className="admin-panel__stats">
									<article>
										<span>Рейтинг</span>
										<strong>
											{selectedUser.rating.toFixed(1)} / 5
										</strong>
									</article>
									<article>
										<span>Связанные заказы</span>
										<strong>
											{relatedOrdersMap.get(
												selectedUser.id,
											) ?? 0}
										</strong>
									</article>
									<article>
										<span>Контакты</span>
										<strong>
											{selectedUser.contacts.length || 0}
										</strong>
									</article>
								</div>

								{selectedUser.pendingEmail ? (
									<p className="admin-panel__hint">
										Текущий email пока остаётся{" "}
										<strong>{selectedUser.email}</strong>.
										Новый адрес{" "}
										<strong>
											{selectedUser.pendingEmail}
										</strong>{" "}
										ждёт подтверждения пользователем.
									</p>
								) : null}

								<div className="admin-form__grid">
									<label>
										<span>Имя</span>
										<input
											value={userEditor.fullName}
											onChange={(event) =>
												setUserEditor((current) =>
													current
														? {
																...current,
																fullName:
																	event.target
																		.value,
															}
														: current,
												)
											}
										/>
									</label>
									<label>
										<span>Email</span>
										<input
											value={userEditor.email}
											onChange={(event) =>
												setUserEditor((current) =>
													current
														? {
																...current,
																email: event
																	.target
																	.value,
															}
														: current,
												)
											}
										/>
									</label>
									<label>
										<span>Роль</span>
										<select
											value={userEditor.role}
											disabled={isSelectedSelf}
											onChange={(event) =>
												setUserEditor((current) =>
													current
														? {
																...current,
																role: event
																	.target
																	.value as UserRole,
															}
														: current,
												)
											}
										>
											<option value="Admin">
												Администратор
											</option>
											<option value="Client">
												Заказчик
											</option>
											<option value="Freelancer">
												Фрилансер
											</option>
										</select>
									</label>
									{selectedUser?.role === "Client" ||
									selectedUser?.role === "Admin" ? (
										<label>
											<span>Компания</span>
											<input
												value={userEditor.companyName}
												onChange={(event) =>
													setUserEditor((current) =>
														current
															? {
																	...current,
																	companyName:
																		event
																			.target
																			.value,
																}
															: current,
													)
												}
												placeholder="Название компании"
											/>
										</label>
									) : null}
									<label>
										<span>Telegram</span>
										<input
											value={userEditor.telegram}
											onChange={(event) =>
												setUserEditor((current) =>
													current
														? {
																...current,
																telegram:
																	event.target
																		.value,
															}
														: current,
												)
											}
											placeholder="@username"
										/>
									</label>
									<label>
										<span>Телефон</span>
										<input
											value={userEditor.phone}
											onChange={(event) =>
												setUserEditor((current) =>
													current
														? {
																...current,
																phone: event
																	.target
																	.value,
															}
														: current,
												)
											}
											placeholder="+7..."
										/>
									</label>
								</div>

								{isSelectedSelf ||
								selectedUser.role === "Admin" ? (
									<p className="admin-panel__hint">
										Для текущего администратора недоступны
										бан, удаление и смена роли.
									</p>
								) : null}
								<div className="admin-form__actions">
									<button
										type="submit"
										className="admin-button"
										disabled={
											pendingUserId === selectedUser.id
										}
									>
										{pendingUserId === selectedUser.id
											? "Сохраняем..."
											: "Сохранить пользователя"}
									</button>
									<button
										type="button"
										className="admin-button admin-button--ghost"
										onClick={() =>
											setUserEditor(
												makeUserEditorState(
													selectedUser,
												),
											)
										}
										disabled={
											pendingUserId === selectedUser.id
										}
									>
										Сбросить
									</button>
								</div>

								<div className="admin-form__actions admin-form__actions--secondary">
									<button
										type="button"
										className="admin-button admin-button--ghost"
										onClick={() => void promoteToAdmin()}
										disabled={
											selectedUser.role === "Admin" ||
											pendingUserId === selectedUser.id
										}
									>
										{selectedUser.role === "Admin"
											? "Уже админ"
											: "Сделать админом"}
									</button>
									<button
										type="button"
										className="admin-button admin-button--ghost"
										onClick={() => void toggleBan()}
										disabled={
											isSelectedSelf ||
											pendingUserId === selectedUser.id ||
											selectedUser.role === "Admin"
										}
									>
										{selectedUser.isBanned
											? "Разбанить"
											: "Забанить"}
									</button>
									<button
										type="button"
										className="admin-button admin-button--danger"
										onClick={() => void deleteUser()}
										disabled={
											isSelectedSelf ||
											pendingUserId === selectedUser.id ||
											selectedUser.role === "Admin"
										}
									>
										Удалить
									</button>
								</div>
							</form>
						) : (
							<PageState
								variant="empty"
								title="Выберите пользователя"
								text="Слева появится карточка с базовыми полями и действиями."
							/>
						)}
					</div>
				</section>
			) : (
				<section className="admin-workspace">
					<div className="admin-column">
						<div className="admin-section__head">
							<div>
								<h2>Заказы</h2>
								<p>
									Редактирование основных полей проекта и
									быстрое удаление без перехода в карточку
									заказа.
								</p>
							</div>
							<span>{filteredOrders.length} записей</span>
						</div>

						<div className="admin-toolbar">
							<input
								value={orderQuery}
								onChange={(event) =>
									setOrderQuery(event.target.value)
								}
								placeholder="Поиск по названию, заказчику или компании"
							/>
							<select
								value={statusFilter}
								onChange={(event) =>
									setStatusFilter(
										event.target.value as OrderStatusFilter,
									)
								}
							>
								<option value="all">Все статусы</option>
								<option value="Draft">Черновики</option>
								<option value="Published">
									Опубликованные
								</option>
								<option value="Paused">На паузе</option>
								<option value="In_Progress">В работе</option>
								<option value="Completed">Завершённые</option>
								<option value="Cancelled">Отменённые</option>
								<option value="Archived">Архив</option>
							</select>
						</div>

						{filteredOrders.length === 0 ? (
							<PageState
								variant="empty"
								title="Заказы не найдены"
								text="Попробуйте изменить параметры поиска."
							/>
						) : (
							<div className="admin-list">
								{filteredOrders.map((order) => (
									<button
										key={order.id}
										type="button"
										className={`admin-list-card ${
											order.id === selectedOrderId
												? "admin-list-card--active"
												: ""
										}`}
										onClick={() =>
											setSelectedOrderId(order.id)
										}
									>
										<div className="admin-list-card__head">
											<div>
												<strong>{order.title}</strong>
												<p>{order.hirerName}</p>
											</div>
											<span className="admin-badge admin-badge--status">
												{statusLabels[order.status]}
											</span>
										</div>

										<div className="admin-list-card__meta">
											<span>
												{order.companyName ||
													"Без компании"}
											</span>
											<span>{formatBudget(order)}</span>
										</div>

										<div className="admin-chip-row">
											<span className="admin-chip">
												{order.proposalsCount} откликов
											</span>
											{order.selectedFreelancerName ? (
												<span className="admin-chip admin-chip--online">
													{
														order.selectedFreelancerName
													}
												</span>
											) : null}
										</div>
									</button>
								))}
							</div>
						)}
					</div>

					<div className="admin-panel">
						{selectedOrder && orderEditor ? (
							<form
								className="admin-form"
								onSubmit={(event) => {
									event.preventDefault();
									void saveOrder();
								}}
							>
								<div className="admin-panel__head">
									<div>
										<h2>{selectedOrder.title}</h2>
										<p>
											Обновляйте карточку проекта и
											управляйте его видимостью из
											админки.
										</p>
									</div>
									<span className="admin-badge admin-badge--status">
										{statusLabels[selectedOrder.status]}
									</span>
								</div>

								<div className="admin-panel__stats">
									<article>
										<span>Заказчик</span>
										<strong>
											{selectedOrder.hirerName}
										</strong>
									</article>
									<article>
										<span>Отклики</span>
										<strong>
											{selectedOrder.proposalsCount}
										</strong>
									</article>
									<article>
										<span>Исполнитель</span>
										<strong>
											{selectedOrder.selectedFreelancerName ||
												"Не назначен"}
										</strong>
									</article>
								</div>

								<div className="admin-form__grid">
									<label className="admin-form__field admin-form__field--wide">
										<span>Название</span>
										<input
											value={orderEditor.title}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																title: event
																	.target
																	.value,
															}
														: current,
												)
											}
										/>
									</label>

									<label>
										<span>Компания</span>
										<input
											value={orderEditor.companyName}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																companyName:
																	event.target
																		.value,
															}
														: current,
												)
											}
										/>
									</label>
									<label>
										<span>Категория</span>
										<select
											value={orderEditor.category}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																category:
																	event.target
																		.value,
															}
														: current,
												)
											}
										>
											{categoryOptions.map((option) => (
												<option
													key={option}
													value={option}
												>
													{option}
												</option>
											))}
										</select>
									</label>
									<label>
										<span>Статус</span>
										<select
											value={orderEditor.status}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																status: event
																	.target
																	.value as ProjectOrder["status"],
															}
														: current,
												)
											}
										>
											<option value="Draft">
												Черновик
											</option>
											<option value="Published">
												Опубликован
											</option>
											<option value="Paused">
												На паузе
											</option>
											<option value="In_Progress">
												В работе
											</option>
											<option value="Completed">
												Завершён
											</option>
											<option value="Cancelled">
												Отменён
											</option>
											<option value="Archived">
												Архив
											</option>
										</select>
									</label>
									<label>
										<span>Минимальный бюджет</span>
										<input
											type="number"
											value={orderEditor.budgetMin}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																budgetMin:
																	event.target
																		.value,
															}
														: current,
												)
											}
										/>
									</label>
									<label>
										<span>Максимальный бюджет</span>
										<input
											type="number"
											value={orderEditor.budgetMax}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																budgetMax:
																	event.target
																		.value,
															}
														: current,
												)
											}
										/>
									</label>
									<label>
										<span>Валюта</span>
										<select
											value={orderEditor.currency}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																currency: event
																	.target
																	.value as ProjectOrder["currency"],
															}
														: current,
												)
											}
										>
											<option value="RUB">RUB</option>
											<option value="USD">USD</option>
											<option value="EUR">EUR</option>
										</select>
									</label>
									<label>
										<span>Тип оплаты</span>
										<select
											value={orderEditor.budgetType}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																budgetType:
																	event.target
																		.value as ProjectOrder["budgetType"],
															}
														: current,
												)
											}
										>
											<option value="fixed">Fixed</option>
											<option value="hourly">
												Hourly
											</option>
										</select>
									</label>
									<label className="admin-form__field admin-form__field--wide">
										<span>Навыки</span>
										<input
											value={orderEditor.skills}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																skills: event
																	.target
																	.value,
															}
														: current,
												)
											}
											placeholder="React, TypeScript, Figma"
										/>
									</label>
									<label className="admin-form__field admin-form__field--wide">
										<span>Описание</span>
										<textarea
											rows={8}
											value={orderEditor.rawDescription}
											onChange={(event) =>
												setOrderEditor((current) =>
													current
														? {
																...current,
																rawDescription:
																	event.target
																		.value,
															}
														: current,
												)
											}
										/>
									</label>
								</div>

								<div className="admin-form__actions">
									<button
										type="submit"
										className="admin-button"
										disabled={
											pendingOrderId === selectedOrder.id
										}
									>
										{pendingOrderId === selectedOrder.id
											? "Сохраняем..."
											: "Сохранить заказ"}
									</button>
									<button
										type="button"
										className="admin-button admin-button--ghost"
										onClick={() =>
											setOrderEditor(
												makeOrderEditorState(
													selectedOrder,
												),
											)
										}
										disabled={
											pendingOrderId === selectedOrder.id
										}
									>
										Сбросить
									</button>
									<NavLink
										to={`/projects/${selectedOrder.id}`}
										className="admin-button admin-button--ghost"
									>
										Открыть заказ
									</NavLink>
								</div>

								<div className="admin-form__actions admin-form__actions--secondary">
									<button
										type="button"
										className="admin-button admin-button--danger"
										onClick={() => void deleteOrder()}
										disabled={
											pendingOrderId === selectedOrder.id
										}
									>
										Удалить заказ
									</button>
								</div>
							</form>
						) : (
							<PageState
								variant="empty"
								title="Выберите заказ"
								text="Слева откроется список проектов, доступных для редактирования."
							/>
						)}
					</div>
				</section>
			)}
		</main>
	);
}
