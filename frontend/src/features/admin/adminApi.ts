import { getMe } from "@/features/Auth";
import type { UserCurrency, UserRole } from "@/features/Auth/getMe.types";
import { getFreelancers, type Freelancer } from "@/features/freelancers";
import {
	getProjects,
	normalizeProjectOrder,
	type BudgetType,
	type Currency,
	type OrderStatus,
	type ProjectOrder,
	type WorkflowStage,
} from "@/features/projects";
import { ADMIN_API, ApiError, apiRequest } from "@/shared";

type AdminUsersResponse = AdminUserApiDto[] | { users?: AdminUserApiDto[] };
type AdminOrdersResponse =
	| Partial<ProjectOrder>[]
	| { orders?: Partial<ProjectOrder>[] };

type AdminUserApiDto = {
	id: number;
	fullName: string;
	email: string;
	pendingEmail?: string | null;
	role: UserRole;
	rating: number;
	contacts?: {
		telegram?: string;
		phone?: string;
	};
	companyName?: string;
	skills?: string[];
	hourlyRate?: number | null;
	currency?: UserCurrency | null;
	completedOrders?: number | null;
	isOnline: boolean;
	isTelegramConnected?: boolean;
	isBanned?: boolean;
	banned?: boolean;
};

type AdminOrderResponse = Partial<ProjectOrder> | { order?: Partial<ProjectOrder> };
type AdminUserResponse = AdminUserApiDto | { user?: AdminUserApiDto };
type AdminMessageApiResponse = { message?: string } | string | null;
type AdminEmailChangeApiResponse = {
	message?: string;
	user?: AdminUserApiDto;
};

const categoryToBackend = {
	"Разработка": "Development",
	"Дизайн": "Design",
	"Маркетинг": "Marketing",
	"Контент": "Content",
} as const;

const paymentToBackend = {
	fixed: "Fixed",
	hourly: "Hourly",
} as const;

const statusToBackend: Record<string, string> = {
	draft: "Draft",
	published: "Published",
	paused: "Paused",
	in_progress: "In_Progress",
	completed: "Completed",
	cancelled: "Cancelled",
	archived: "Archived",
	Draft: "Draft",
	Published: "Published",
	Paused: "Paused",
	In_Progress: "In_Progress",
	Completed: "Completed",
	Cancelled: "Cancelled",
	Archived: "Archived",
};

export type AdminUserRecord = {
	id: number;
	fullName: string;
	role: UserRole;
	email: string;
	pendingEmail: string | null;
	companyName: string;
	telegram: string;
	phone: string;
	contacts: string[];
	rating: number;
	isOnline: boolean;
	isBanned: boolean;
	skills: string[];
	hourlyRate: number | null;
	currency: UserCurrency | null;
	completedOrders: number | null;
};

export type AdminUserUpdateInput = {
	fullName: string;
	email: string;
	role: UserRole;
	telegram: string;
	phone: string;
	companyName: string;
};

export type AdminOrderUpdateInput = {
	title: string;
	rawDescription: string;
	companyName: string;
	category: string;
	status: OrderStatus;
	budgetMin: number;
	budgetMax: number;
	currency: Currency;
	budgetType: BudgetType;
	skills: string[];
	workflowStage: WorkflowStage;
};

export type AdminActionResponse = {
	message: string;
};

export type AdminEmailChangeResult = {
	message: string;
	user: AdminUserRecord;
};

function isAdminApiMissing(error: unknown) {
	return (
		error instanceof ApiError &&
		(error.status === 404 || error.status === 405 || error.status === 501)
	);
}

function ensureAdminActionAvailable(error: unknown, message: string): never {
	if (isAdminApiMissing(error)) {
		throw new ApiError(message, 501, null);
	}

	throw error;
}

function makeContactList(values: Array<string | undefined>) {
	return Array.from(
		new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
	);
}

function normalizeAdminUser(user: AdminUserApiDto): AdminUserRecord {
	const telegram = user.contacts?.telegram?.trim() ?? "";
	const phone = user.contacts?.phone?.trim() ?? "";

	return {
		id: user.id,
		fullName: user.fullName || `Пользователь #${user.id}`,
		role: user.role,
		email: user.email || "Нет данных",
		pendingEmail: user.pendingEmail?.trim() || null,
		companyName: user.companyName?.trim() ?? "",
		telegram,
		phone,
		contacts: makeContactList([telegram, phone]),
		rating: Number.isFinite(user.rating) ? user.rating : 0,
		isOnline: Boolean(user.isOnline),
		isBanned: Boolean(user.isBanned ?? user.banned),
		skills: user.skills ?? [],
		hourlyRate: user.hourlyRate ?? null,
		currency: user.currency ?? null,
		completedOrders: user.completedOrders ?? null,
	};
}

function mergeUserRecord(
	current: AdminUserRecord | undefined,
	next: AdminUserRecord,
): AdminUserRecord {
	return {
		id: next.id,
		fullName: next.fullName || current?.fullName || `Пользователь #${next.id}`,
		role:
			current?.role === "Admin" || next.role === "Admin"
				? "Admin"
				: next.role,
		email: next.email || current?.email || "Нет данных",
		pendingEmail: next.pendingEmail ?? current?.pendingEmail ?? null,
		companyName: next.companyName || current?.companyName || "",
		telegram: next.telegram || current?.telegram || "",
		phone: next.phone || current?.phone || "",
		contacts: makeContactList([
			next.telegram,
			next.phone,
			current?.telegram,
			current?.phone,
		]),
		rating: next.rating ?? current?.rating ?? 0,
		isOnline: next.isOnline ?? current?.isOnline ?? false,
		isBanned: next.isBanned ?? current?.isBanned ?? false,
		skills: next.skills.length ? next.skills : (current?.skills ?? []),
		hourlyRate: next.hourlyRate ?? current?.hourlyRate ?? null,
		currency: next.currency ?? current?.currency ?? null,
		completedOrders: next.completedOrders ?? current?.completedOrders ?? null,
	};
}

function fromFreelancer(freelancer: Freelancer): AdminUserRecord {
	return {
		id: freelancer.id,
		fullName: freelancer.fullName,
		role: "Freelancer",
		email: freelancer.contacts.email,
		pendingEmail: null,
		companyName: "",
		telegram: freelancer.contacts.telegram ?? "",
		phone: freelancer.contacts.phone ?? "",
		contacts: makeContactList([
			freelancer.contacts.telegram,
			freelancer.contacts.phone,
		]),
		rating: freelancer.rating,
		isOnline: freelancer.isOnline,
		isBanned: false,
		skills: freelancer.skills,
		hourlyRate: freelancer.hourlyRate,
		currency: freelancer.currency,
		completedOrders: freelancer.completedProjects,
	};
}

function fromOrderClient(
	order: ProjectOrder,
	existingEmail = "Нет данных",
	isOnline = false,
): AdminUserRecord {
	return {
		id: order.hirerId,
		fullName: order.hirerName || `Заказчик #${order.hirerId}`,
		role: "Client",
		email: existingEmail,
		pendingEmail: null,
		companyName: order.companyName || "",
		telegram: "",
		phone: "",
		contacts: [],
		rating: order.hirerRating ?? 0,
		isOnline,
		isBanned: false,
		skills: [],
		hourlyRate: null,
		currency: null,
		completedOrders: null,
	};
}

async function buildAdminUsersFallback() {
	const [currentUser, projectsItems, freelancerItems] = await Promise.all([
		getMe().catch(() => null),
		getProjects(),
		getFreelancers(),
	]);

	const usersMap = new Map<number, AdminUserRecord>();

	if (currentUser) {
		usersMap.set(
			currentUser.id,
			mergeUserRecord(usersMap.get(currentUser.id), {
				id: currentUser.id,
				fullName: currentUser.fullName || "Администратор",
				role: currentUser.role,
				email: currentUser.email,
				pendingEmail: null,
				companyName:
					"companyName" in currentUser
						? currentUser.companyName?.trim() ?? ""
						: "",
				telegram: currentUser.contacts?.telegram?.trim() ?? "",
				phone: currentUser.contacts?.phone?.trim() ?? "",
				contacts: makeContactList([
					currentUser.contacts?.telegram,
					currentUser.contacts?.phone,
				]),
				rating: currentUser.rating ?? 0,
				isOnline: currentUser.isOnline ?? false,
				isBanned: false,
				skills:
					"skills" in currentUser && Array.isArray(currentUser.skills)
						? currentUser.skills
						: [],
				hourlyRate:
					"hourlyRate" in currentUser ? currentUser.hourlyRate ?? null : null,
				currency:
					"currency" in currentUser ? currentUser.currency ?? null : null,
				completedOrders:
					"completedOrders" in currentUser
						? currentUser.completedOrders ?? null
						: null,
			}),
		);
	}

	freelancerItems.forEach((freelancer) => {
		usersMap.set(
			freelancer.id,
			mergeUserRecord(usersMap.get(freelancer.id), fromFreelancer(freelancer)),
		);
	});

	projectsItems.forEach((order) => {
		usersMap.set(
			order.hirerId,
			mergeUserRecord(
				usersMap.get(order.hirerId),
				fromOrderClient(
					order,
					currentUser?.id === order.hirerId
						? currentUser.email
						: usersMap.get(order.hirerId)?.email ?? "Нет данных",
					currentUser?.id === order.hirerId
						? (currentUser.isOnline ?? false)
						: usersMap.get(order.hirerId)?.isOnline ?? false,
				),
			),
		);
	});

	return Array.from(usersMap.values()).sort((left, right) => {
		if (left.role === "Admin" && right.role !== "Admin") return -1;
		if (left.role !== "Admin" && right.role === "Admin") return 1;
		return left.fullName.localeCompare(right.fullName, "ru");
	});
}

function unwrapUsersResponse(response: AdminUsersResponse) {
	return Array.isArray(response) ? response : (response.users ?? []);
}

function unwrapOrdersResponse(response: AdminOrdersResponse) {
	return Array.isArray(response) ? response : (response.orders ?? []);
}

function unwrapUserResponse(response: AdminUserResponse) {
	if (typeof response === "object" && response && "id" in response) {
		return response;
	}

	if (
		typeof response === "object" &&
		response &&
		"user" in response &&
		response.user
	) {
		return response.user;
	}

	throw new Error("Сервер не вернул пользователя после изменения.");
}

function unwrapOrderResponse(response: AdminOrderResponse) {
	if (typeof response === "object" && response && "id" in response) {
		return response;
	}

	if (
		typeof response === "object" &&
		response &&
		"order" in response &&
		response.order
	) {
		return response.order;
	}

	throw new Error("Сервер не вернул заказ после изменения.");
}

function normalizeActionMessage(
	response: AdminMessageApiResponse,
	fallback: string,
): AdminActionResponse {
	if (typeof response === "string" && response.trim()) {
		return { message: response };
	}

	if (
		typeof response === "object" &&
		response &&
		"message" in response &&
		typeof response.message === "string" &&
		response.message.trim()
	) {
		return { message: response.message };
	}

	return { message: fallback };
}

function normalizeUserActionMessage(
	response: AdminEmailChangeApiResponse,
	fallback: string,
): AdminEmailChangeResult {
	if (!response.user) {
		throw new Error("Сервер не вернул пользователя после запуска смены email.");
	}

	return {
		message:
			typeof response.message === "string" && response.message.trim()
				? response.message
				: fallback,
		user: normalizeAdminUser(response.user),
	};
}

function buildAdminUserPayload(
	record: AdminUserRecord,
	input: AdminUserUpdateInput,
) {
	const role = input.role;

	return {
		fullName: input.fullName.trim(),
		email: input.email.trim().toLowerCase(),
		role,
		contacts: {
			telegram: input.telegram.trim(),
			phone: input.phone.trim(),
		},
		companyName:
			role === "Client" || role === "Admin" ? input.companyName.trim() : "",
		skills: role === "Freelancer" ? record.skills : [],
		hourlyRate: role === "Freelancer" ? record.hourlyRate ?? 0 : 0,
		currency: role === "Freelancer" ? record.currency ?? "RUB" : "RUB",
	};
}

function buildAdminOrderPayload(
	order: ProjectOrder,
	input: AdminOrderUpdateInput,
) {
	return {
		title: input.title.trim(),
		rawDescription: input.rawDescription.trim(),
		technicalSpecification: order.technicalSpecification,
		category:
			categoryToBackend[input.category as keyof typeof categoryToBackend] ??
			input.category,
		budgetMin: input.budgetMin,
		budgetMax: input.budgetMax,
		currency: input.currency,
		budgetType:
			paymentToBackend[input.budgetType as keyof typeof paymentToBackend] ??
			input.budgetType,
		status: statusToBackend[input.status] ?? input.status,
		workflowStage: input.workflowStage,
		skills: input.skills,
		aiGenerated: order.aiGenerated,
		readinessScore: order.readinessScore,
		briefSections: order.briefSections,
		clarificationQuestions: order.clarificationQuestions,
		scopeItems: order.scopeItems,
		doneCriteria: order.doneCriteria,
		risks: order.risks,
		companyName: input.companyName.trim(),
	};
}

export async function getAdminUsers() {
	try {
		const response = await apiRequest<AdminUsersResponse>(`${ADMIN_API}/users`);
		return unwrapUsersResponse(response).map(normalizeAdminUser);
	} catch (error) {
		if (!isAdminApiMissing(error)) {
			throw error;
		}

		return buildAdminUsersFallback();
	}
}

export async function getAdminOrders() {
	try {
		const response = await apiRequest<AdminOrdersResponse>(`${ADMIN_API}/orders`);
		return unwrapOrdersResponse(response).map(normalizeProjectOrder);
	} catch (error) {
		if (!isAdminApiMissing(error)) {
			throw error;
		}

		return getProjects();
	}
}

export async function updateAdminUserRequest(
	record: AdminUserRecord,
	input: AdminUserUpdateInput,
) {
	try {
		const response = await apiRequest<AdminUserResponse>(
			`${ADMIN_API}/users/${record.id}`,
			{
				method: "PUT",
				body: buildAdminUserPayload(record, input),
			},
		);

		return normalizeAdminUser(unwrapUserResponse(response));
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает редактирование пользователей из админки.",
		);
	}
}

export async function requestAdminUserEmailChangeRequest(
	userId: number,
	newEmail: string,
) {
	try {
		const response = await apiRequest<AdminEmailChangeApiResponse>(
			`${ADMIN_API}/users/${userId}/email-change-request`,
			{
				method: "POST",
				body: {
					newEmail: newEmail.trim().toLowerCase(),
				},
			},
		);

		return normalizeUserActionMessage(
			response,
			"На новый email отправлен код подтверждения.",
		);
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает подтверждаемую смену email из админки.",
		);
	}
}

export async function promoteUserToAdminRequest(userId: number) {
	try {
		const response = await apiRequest<AdminUserResponse>(
			`${ADMIN_API}/users/${userId}/promote`,
			{
				method: "PUT",
			},
		);

		return normalizeAdminUser(unwrapUserResponse(response));
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает повышение пользователей до администратора.",
		);
	}
}

export async function banAdminUserRequest(userId: number, banned: boolean) {
	try {
		const response = await apiRequest<AdminUserResponse>(
			`${ADMIN_API}/users/${userId}/ban`,
			{
				method: "PUT",
				body: {
					banned,
					isBanned: banned,
				},
			},
		);

		return normalizeAdminUser(unwrapUserResponse(response));
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает бан пользователей из админки.",
		);
	}
}

export async function deleteAdminUserRequest(userId: number) {
	try {
		const response = await apiRequest<AdminMessageApiResponse>(
			`${ADMIN_API}/users/${userId}`,
			{
				method: "DELETE",
			},
		);

		return normalizeActionMessage(response, "Пользователь удалён.");
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает удаление пользователей из админки.",
		);
	}
}

export async function updateAdminOrderRequest(
	order: ProjectOrder,
	input: AdminOrderUpdateInput,
) {
	try {
		const response = await apiRequest<AdminOrderResponse>(
			`${ADMIN_API}/orders/${order.id}`,
			{
				method: "PUT",
				body: buildAdminOrderPayload(order, input),
			},
		);

		return normalizeProjectOrder(unwrapOrderResponse(response));
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает редактирование заказов из админки.",
		);
	}
}

export async function deleteAdminOrderRequest(orderId: number) {
	try {
		const response = await apiRequest<AdminMessageApiResponse>(
			`${ADMIN_API}/orders/${orderId}`,
			{
				method: "DELETE",
			},
		);

		return normalizeActionMessage(response, "Заказ удалён.");
	} catch (error) {
		ensureAdminActionAvailable(
			error,
			"Бэкенд ещё не поддерживает удаление заказов из админки.",
		);
	}
}
