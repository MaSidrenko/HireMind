import type { Page, Request } from "@playwright/test";
import type {
	ClientUser,
	FreelancerUser,
	User,
} from "../../src/features/Auth/getMe.types";
import type {
	BriefSections,
	ClarificationQuestion,
	DoneCriterion,
	ProjectOrder,
	ProjectProposal,
	RiskItem,
	ScopeItem,
} from "../../src/features/projects/types";

type RequestLogEntry = {
	method: string;
	pathname: string;
	search: string;
	body: unknown;
};

type MockApiOptions = {
	initialUser?: User | null;
	signInUser?: User;
	acceptedProjects?: unknown[];
	initialOrders?: Partial<ProjectOrder>[];
};

export const mockFreelancerUser: FreelancerUser = {
	id: 1,
	fullName: "Иван Исполнитель",
	email: "freelancer@test.com",
	contacts: {
		telegram: "@freelancer",
		phone: "+79990000001",
	},
	role: "Freelancer",
	skills: ["React", "TypeScript"],
	isOnline: true,
	hourlyRate: 1500,
	currency: "RUB",
	completedOrders: 3,
	rating: 4.7,
};

export const mockClientUser: ClientUser = {
	id: 2,
	fullName: "Анна Заказчик",
	email: "client@test.com",
	contacts: {
		telegram: "@client",
		phone: "+79990000002",
	},
	role: "Client",
	companyName: "HireMind",
	isOnline: true,
	rating: 4.9,
};

function cloneValue<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

async function readRequestBody(request: Request) {
	const rawBody = request.postData();

	if (!rawBody) {
		return null;
	}

	try {
		return JSON.parse(rawBody) as unknown;
	} catch {
		return rawBody;
	}
}

function mergeProfilePatch(currentUser: User | null, patch: unknown): User | null {
	if (!currentUser || typeof patch !== "object" || patch === null) {
		return currentUser;
	}

	const nextUser = {
		...currentUser,
		...patch,
		contacts: {
			...currentUser.contacts,
			...((patch as { contacts?: User["contacts"] }).contacts ?? {}),
		},
	} as User;

	if (nextUser.role === "Freelancer" && !("skills" in nextUser)) {
		return {
			...nextUser,
			skills: [],
			hourlyRate: null,
			currency: null,
			completedOrders: 0,
		};
	}

	return nextUser;
}

const backendCategoryToUi = {
	Development: "Разработка",
	Design: "Дизайн",
	Marketing: "Маркетинг",
	Content: "Контент",
	MobileDevelopment: "Мобильная разработка",
} as const;

const landingCategoryToOrderCategories = {
	Development: ["Development", "Разработка", "Веб-разработка"],
	Design: ["Design", "Дизайн"],
	Marketing: ["Marketing", "Маркетинг"],
	Content: ["Content", "Контент", "Копирайтинг"],
	MobileDevelopment: ["MobileDevelopment", "Мобильная разработка"],
} as const;

const emptyBriefSections: BriefSections = {
	goal: "",
	audience: "",
	screens: "",
	features: "",
	content: "",
	design: "",
	constraints: "",
	openQuestions: "",
};

function asNumber(value: unknown, fallback = 0) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asOptionalNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

function asCurrency(value: unknown): ProjectOrder["currency"] {
	return value === "USD" || value === "EUR" || value === "RUB" ? value : "RUB";
}

function asBudgetType(value: unknown): ProjectOrder["budgetType"] {
	if (value === "Hourly" || value === "hourly") {
		return "hourly";
	}

	return "fixed";
}

function asCategory(value: unknown) {
	if (typeof value !== "string") {
		return "Разработка";
	}

	return backendCategoryToUi[value as keyof typeof backendCategoryToUi] ?? value;
}

function asStatus(value: unknown): ProjectOrder["status"] {
	switch (value) {
		case "Draft":
		case "Published":
		case "Paused":
		case "In_Progress":
		case "Completed":
		case "Cancelled":
		case "Archived":
			return value;
		default:
			return "Draft";
	}
}

function asWorkflowStage(value: unknown): ProjectOrder["workflowStage"] {
	switch (value) {
		case "raw":
		case "clarification":
		case "brief":
		case "review":
		case "approved":
			return value;
		default:
			return "raw";
	}
}

function asBriefSections(
	value: unknown,
	title: string,
	rawDescription: string,
): BriefSections {
	if (typeof value !== "object" || value === null) {
		return {
			...emptyBriefSections,
			goal: title ? `Получить результат по задаче: ${title}.` : "",
			openQuestions: rawDescription,
		};
	}

	const partial = value as Partial<BriefSections>;
	return {
		goal: asString(
			partial.goal,
			title ? `Получить результат по задаче: ${title}.` : "",
		),
		audience: asString(partial.audience),
		screens: asString(partial.screens),
		features: asString(partial.features),
		content: asString(partial.content),
		design: asString(partial.design),
		constraints: asString(partial.constraints),
		openQuestions: asString(partial.openQuestions, rawDescription),
	};
}

function asQuestions(value: unknown): ClarificationQuestion[] {
	return Array.isArray(value)
		? cloneValue(value as ClarificationQuestion[])
		: [];
}

function asScopeItems(value: unknown): ScopeItem[] {
	return Array.isArray(value) ? cloneValue(value as ScopeItem[]) : [];
}

function asDoneCriteria(value: unknown): DoneCriterion[] {
	return Array.isArray(value) ? cloneValue(value as DoneCriterion[]) : [];
}

function asRisks(value: unknown): RiskItem[] {
	return Array.isArray(value) ? cloneValue(value as RiskItem[]) : [];
}

function toProjectOrder(order: Partial<ProjectOrder>): ProjectOrder {
	const title = asString(order.title, "Без названия");
	const rawDescription = asString(order.rawDescription);
	const proposals = Array.isArray(order.proposals)
		? cloneValue(order.proposals)
		: [];

	return {
		id: asNumber(order.id),
		hirerId: asNumber(order.hirerId),
		hirerName: asString(order.hirerName, "Заказчик"),
		hirerRating: asNumber(order.hirerRating),
		selectedFreelancerId:
			typeof order.selectedFreelancerId === "number"
				? order.selectedFreelancerId
				: null,
		selectedFreelancerName:
			typeof order.selectedFreelancerName === "string"
				? order.selectedFreelancerName
				: null,
		selectedFreelancerRating: asOptionalNumber(order.selectedFreelancerRating),
		title,
		shortDescription: asString(
			order.shortDescription,
			rawDescription.slice(0, 150),
		),
		rawDescription,
		technicalSpecification: asString(order.technicalSpecification),
		status: asStatus(order.status),
		workflowStage: asWorkflowStage(order.workflowStage),
		category: asCategory(order.category),
		budgetMin: asNumber(order.budgetMin),
		budgetMax: asNumber(order.budgetMax, asNumber(order.budgetMin)),
		currency: asCurrency(order.currency),
		budgetType: asBudgetType(order.budgetType),
		skills: asStringArray(order.skills),
		proposalsCount: proposals.length,
		proposals,
		publishedAt:
			typeof order.publishedAt === "string" ? order.publishedAt : null,
		completedAt:
			typeof order.completedAt === "string" ? order.completedAt : null,
		updatedAt:
			typeof order.updatedAt === "string"
				? order.updatedAt
				: new Date().toISOString(),
		companyName: asString(order.companyName),
		aiGenerated: Boolean(order.aiGenerated),
		readinessScore: asNumber(order.readinessScore),
		briefSections: asBriefSections(order.briefSections, title, rawDescription),
		clarificationQuestions: asQuestions(order.clarificationQuestions),
		scopeItems: asScopeItems(order.scopeItems),
		doneCriteria: asDoneCriteria(order.doneCriteria),
		risks: asRisks(order.risks),
		approvals: {
			client: Boolean(order.approvals?.client),
			freelancer: Boolean(order.approvals?.freelancer),
			clientDone: Boolean(order.approvals?.clientDone),
			freelancerDone: Boolean(order.approvals?.freelancerDone),
		},
		clientRatingByFreelancer: asOptionalNumber(order.clientRatingByFreelancer),
		freelancerRatingByClient: asOptionalNumber(order.freelancerRatingByClient),
	};
}

function getUserRating(user: User | null) {
	return user && typeof user.rating === "number" ? user.rating : 0;
}

export async function setupMockApi(
	page: Page,
	options: MockApiOptions = {},
) {
	let currentUser = options.initialUser ?? null;
	const signInUser = cloneValue(options.signInUser ?? mockClientUser);
	const staticAcceptedProjects = cloneValue(options.acceptedProjects ?? []);
	const signInUsersByEmail = new Map<string, User>([
		[mockClientUser.email.toLowerCase(), cloneValue(mockClientUser)],
		[mockFreelancerUser.email.toLowerCase(), cloneValue(mockFreelancerUser)],
		[signInUser.email.toLowerCase(), cloneValue(signInUser)],
	]);
	const requestLog: RequestLogEntry[] = [];
	let orders = (options.initialOrders ?? []).map((order) => toProjectOrder(order));
	let nextOrderId =
		orders.reduce((maxId, order) => Math.max(maxId, order.id), 0) + 1;
	let nextProposalId =
		orders.reduce((maxId, order) => {
			const orderMax = order.proposals.reduce(
				(maxProposalId, proposal) => Math.max(maxProposalId, proposal.id),
				0,
			);
			return Math.max(maxId, orderMax);
		}, 0) + 1;

	const replaceOrder = (nextOrder: ProjectOrder) => {
		orders = orders.some((order) => order.id === nextOrder.id)
			? orders.map((order) => (order.id === nextOrder.id ? nextOrder : order))
			: [nextOrder, ...orders];
		return nextOrder;
	};

	const getAcceptedProjectsForCurrentUser = () => {
		if (!currentUser) {
			return staticAcceptedProjects;
		}

		if (currentUser.role === "Client") {
			return orders.filter((order) => order.hirerId === currentUser.id);
		}

		return orders.filter(
			(order) => order.selectedFreelancerId === currentUser.id,
		);
	};

	await page.route("**/api/v1/**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const { pathname, search } = url;
		const method = request.method();
		const body =
			method === "POST" || method === "PUT" || method === "PATCH"
				? await readRequestBody(request)
				: null;

		requestLog.push({
			method,
			pathname,
			search,
			body,
		});

		if (pathname === "/api/v1/main/user-count" && method === "GET") {
			await route.fulfill(jsonResponse(signInUsersByEmail.size));
			return;
		}

		if (
			pathname === "/api/v1/main/project-type-count" &&
			method === "GET"
		) {
			const requestedCategory = url.searchParams.get("category") as
				| keyof typeof landingCategoryToOrderCategories
				| null;
			const allowedCategories =
				(requestedCategory &&
					landingCategoryToOrderCategories[requestedCategory]) ??
				[];
			const count = orders.filter((order) =>
				allowedCategories.includes(order.category),
			).length;

			await route.fulfill(jsonResponse(count));
			return;
		}

		if (pathname === "/api/v1/auth/me" && method === "GET") {
			if (!currentUser) {
				await route.fulfill(
					jsonResponse({ message: "Unauthorized" }, 401),
				);
				return;
			}

			await route.fulfill(
				jsonResponse({
					user: cloneValue(currentUser),
				}),
			);
			return;
		}

		if (pathname === "/api/v1/auth/sign-in" && method === "POST") {
			const email = asString((body as { email?: unknown })?.email)
				.trim()
				.toLowerCase();
			currentUser = cloneValue(
				signInUsersByEmail.get(email) ?? signInUser,
			);

			await route.fulfill(
				jsonResponse({
					user: cloneValue(currentUser),
				}),
			);
			return;
		}

		if (pathname === "/api/v1/auth/sign-up" && method === "POST") {
			await route.fulfill(
				jsonResponse({
					message:
						"Пользователь зарегистрирован. Код подтверждения отправлен на email.",
				}),
			);
			return;
		}

		if (pathname === "/api/v1/auth/email-verify" && method === "POST") {
			await route.fulfill(
				jsonResponse({
					message: "Email успешно подтвержден",
				}),
			);
			return;
		}

		if (pathname === "/api/v1/auth/recovery-password" && method === "POST") {
			await route.fulfill(
				jsonResponse({
					message:
						"Если email привязан к аккаунту, код отправлен на почту.",
				}),
			);
			return;
		}

		if (
			pathname === "/api/v1/auth/recovery-password/confirm" &&
			method === "POST"
		) {
			await route.fulfill(
				jsonResponse({
					message: "Пароль успешно обновлён",
				}),
			);
			return;
		}

		if (pathname === "/api/v1/auth/logout" && method === "POST") {
			currentUser = null;

			await route.fulfill(
				jsonResponse({
					message: "Signed out successfully.",
				}),
			);
			return;
		}

		if (pathname === "/api/v1/profile" && method === "PUT") {
			currentUser = mergeProfilePatch(currentUser, body);

			await route.fulfill(
				jsonResponse({
					user: cloneValue(currentUser),
				}),
			);
			return;
		}

		if (pathname === "/api/v1/profile/skills" && method === "PATCH") {
			if (
				currentUser?.role === "Freelancer" &&
				typeof body === "object" &&
				body !== null &&
				Array.isArray((body as { skills?: unknown[] }).skills)
			) {
				currentUser = {
					...currentUser,
					skills: [...(body as { skills: string[] }).skills],
				};
			}

			await route.fulfill(jsonResponse({ ok: true }));
			return;
		}

		if (
			pathname === "/api/v1/profile/telegram/connect-link" &&
			method === "POST"
		) {
			await route.fulfill(
				jsonResponse({
					connectUrl: "https://t.me/hiremind_test_bot?start=mock",
					expiresAtUtc: new Date(Date.now() + 5 * 60_000).toISOString(),
				}),
			);
			return;
		}

		if (pathname === "/api/v1/order/get-accepted-projects" && method === "GET") {
			await route.fulfill(
				jsonResponse(cloneValue(getAcceptedProjectsForCurrentUser())),
			);
			return;
		}

		if (pathname === "/api/v1/order/get-all" && method === "GET") {
			await route.fulfill(jsonResponse(cloneValue(orders)));
			return;
		}

		if (pathname.startsWith("/api/v1/order/get-by-id/") && method === "GET") {
			const orderId = Number(pathname.split("/").pop());
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			await route.fulfill(jsonResponse(cloneValue(order)));
			return;
		}

		if (pathname === "/api/v1/order/create" && method === "POST") {
			if (!currentUser) {
				await route.fulfill(
					jsonResponse({ message: "Unauthorized" }, 401),
				);
				return;
			}

			const draft = body as Partial<ProjectOrder> | null;
			const now = new Date().toISOString();
			const rawDescription = asString(draft?.rawDescription);
			const budgetMin = asNumber(draft?.budgetMin);
			const order = toProjectOrder({
				id: nextOrderId++,
				hirerId: currentUser.id,
				hirerName: currentUser.fullName,
				hirerRating: getUserRating(currentUser),
				title: asString(draft?.title, "Без названия"),
				shortDescription: rawDescription.slice(0, 150),
				rawDescription,
				technicalSpecification: asString(draft?.technicalSpecification),
				status: "Draft",
				workflowStage: "raw",
				category: asCategory(draft?.category),
				budgetMin,
				budgetMax: asNumber(draft?.budgetMax, budgetMin),
				currency: asCurrency(draft?.currency),
				budgetType: asBudgetType(draft?.budgetType),
				skills: asStringArray(draft?.skills),
				publishedAt: null,
				completedAt: null,
				updatedAt: now,
				companyName:
					currentUser.role === "Client"
						? currentUser.companyName ?? ""
						: "",
				aiGenerated: Boolean(draft?.aiGenerated),
				readinessScore: asNumber(draft?.readinessScore),
				briefSections: asBriefSections(
					draft?.briefSections,
					asString(draft?.title, "Без названия"),
					rawDescription,
				),
				clarificationQuestions: asQuestions(draft?.clarificationQuestions),
				scopeItems: asScopeItems(draft?.scopeItems),
				doneCriteria: asDoneCriteria(draft?.doneCriteria),
				risks: asRisks(draft?.risks),
				approvals: {
					client: false,
					freelancer: false,
					clientDone: false,
					freelancerDone: false,
				},
				clientRatingByFreelancer: null,
				freelancerRatingByClient: null,
				proposals: [],
			});

			replaceOrder(order);
			await route.fulfill(jsonResponse(cloneValue(order)));
			return;
		}

		if (pathname.startsWith("/api/v1/order/update/") && method === "PUT") {
			const orderId = Number(pathname.split("/").pop());
			const currentOrder = orders.find((item) => item.id === orderId);

			if (!currentOrder) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const patch = body as Partial<ProjectOrder> | null;
			const budgetMin = asNumber(patch?.budgetMin, currentOrder.budgetMin);
			const nextStatus = patch?.status
				? asStatus(patch.status)
				: currentOrder.status;
			const nextOrder = toProjectOrder({
				...currentOrder,
				title: asString(patch?.title, currentOrder.title),
				shortDescription: asString(
					patch?.shortDescription,
					asString(
						patch?.rawDescription,
						currentOrder.rawDescription,
					).slice(0, 150),
				),
				rawDescription: asString(
					patch?.rawDescription,
					currentOrder.rawDescription,
				),
				technicalSpecification: asString(
					patch?.technicalSpecification,
					currentOrder.technicalSpecification,
				),
				status: nextStatus,
				workflowStage: patch?.workflowStage
					? asWorkflowStage(patch.workflowStage)
					: currentOrder.workflowStage,
				category: patch?.category
					? asCategory(patch.category)
					: currentOrder.category,
				budgetMin,
				budgetMax: asNumber(patch?.budgetMax, currentOrder.budgetMax || budgetMin),
				currency: patch?.currency
					? asCurrency(patch.currency)
					: currentOrder.currency,
				budgetType: patch?.budgetType
					? asBudgetType(patch.budgetType)
					: currentOrder.budgetType,
				skills: patch?.skills
					? asStringArray(patch.skills)
					: currentOrder.skills,
				publishedAt:
					nextStatus === "Published"
						? asString(
							patch?.publishedAt,
							currentOrder.publishedAt ?? new Date().toISOString(),
						)
						: currentOrder.publishedAt,
				updatedAt: new Date().toISOString(),
				aiGenerated:
					typeof patch?.aiGenerated === "boolean"
						? patch.aiGenerated
						: currentOrder.aiGenerated,
				readinessScore: asNumber(
					patch?.readinessScore,
					currentOrder.readinessScore,
				),
				briefSections: patch?.briefSections
					? asBriefSections(
						patch.briefSections,
						asString(patch?.title, currentOrder.title),
						asString(
							patch?.rawDescription,
							currentOrder.rawDescription,
						),
					)
					: currentOrder.briefSections,
				clarificationQuestions: patch?.clarificationQuestions
					? asQuestions(patch.clarificationQuestions)
					: currentOrder.clarificationQuestions,
				scopeItems: patch?.scopeItems
					? asScopeItems(patch.scopeItems)
					: currentOrder.scopeItems,
				doneCriteria: patch?.doneCriteria
					? asDoneCriteria(patch.doneCriteria)
					: currentOrder.doneCriteria,
				risks: patch?.risks
					? asRisks(patch.risks)
					: currentOrder.risks,
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (pathname === "/api/v1/order/proposal/create" && method === "PUT") {
			if (!currentUser || currentUser.role !== "Freelancer") {
				await route.fulfill(
					jsonResponse({ message: "Forbidden" }, 403),
				);
				return;
			}

			const draft = body as {
				orderId?: number;
				price?: number;
				message?: string;
				estimatedDays?: number;
			} | null;
			const order = orders.find((item) => item.id === asNumber(draft?.orderId));

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const proposal: ProjectProposal = {
				id: nextProposalId++,
				projectId: order.id,
				freelancerId: currentUser.id,
				freelancerName: currentUser.fullName,
				message: asString(draft?.message),
				price: asNumber(draft?.price),
				currency: order.currency,
				estimatedDays: asNumber(draft?.estimatedDays),
				status: "pending",
				createdAt: new Date().toISOString(),
			};

			const nextOrder = toProjectOrder({
				...order,
				proposals: [proposal, ...order.proposals],
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/proposal/") &&
			pathname.endsWith("/accept") &&
			method === "PUT"
		) {
			const proposalId = Number(pathname.split("/")[5]);
			const order = orders.find((item) =>
				item.proposals.some((proposal) => proposal.id === proposalId),
			);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Proposal not found" }, 404),
				);
				return;
			}

			const acceptedProposal = order.proposals.find(
				(proposal) => proposal.id === proposalId,
			);

			if (!acceptedProposal) {
				await route.fulfill(
					jsonResponse({ message: "Proposal not found" }, 404),
				);
				return;
			}

			const nextOrder = toProjectOrder({
				...order,
				selectedFreelancerId: acceptedProposal.freelancerId,
				selectedFreelancerName: acceptedProposal.freelancerName,
				selectedFreelancerRating: mockFreelancerUser.rating,
				proposals: order.proposals.map((proposal) =>
					proposal.id === proposalId
						? { ...proposal, status: "accepted" }
						: proposal.status === "withdrawn"
							? proposal
							: { ...proposal, status: "declined" },
				),
				approvals: {
					client: false,
					freelancer: false,
					clientDone: false,
					freelancerDone: false,
				},
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/") &&
			pathname.includes("/approval/") &&
			method === "PUT"
		) {
			const [, , , , orderIdRaw, , sideRaw] = pathname.split("/");
			const orderId = Number(orderIdRaw);
			const side = sideRaw === "client" ? "client" : "freelancer";
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const approved = Boolean((body as { approved?: unknown })?.approved);
			const nextApprovals = {
				...order.approvals,
				[side]: approved,
			};
			const nextOrder = toProjectOrder({
				...order,
				status:
					nextApprovals.client && nextApprovals.freelancer
						? "In_Progress"
						: "Published",
				approvals: nextApprovals,
				completedAt: null,
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/") &&
			pathname.endsWith("/completion/freelancer") &&
			method === "PUT"
		) {
			const orderId = Number(pathname.split("/")[4]);
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const nextOrder = toProjectOrder({
				...order,
				approvals: {
					...order.approvals,
					freelancerDone: true,
				},
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/") &&
			pathname.endsWith("/completion/client/accept") &&
			method === "PUT"
		) {
			const orderId = Number(pathname.split("/")[4]);
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const nextOrder = toProjectOrder({
				...order,
				status: "Completed",
				completedAt: new Date().toISOString(),
				approvals: {
					...order.approvals,
					clientDone: true,
				},
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/") &&
			pathname.endsWith("/completion/client/reject") &&
			method === "PUT"
		) {
			const orderId = Number(pathname.split("/")[4]);
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const nextOrder = toProjectOrder({
				...order,
				status: "In_Progress",
				completedAt: null,
				approvals: {
					...order.approvals,
					clientDone: false,
					freelancerDone: false,
				},
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		if (
			pathname.startsWith("/api/v1/order/") &&
			pathname.endsWith("/rating") &&
			method === "PUT"
		) {
			const orderId = Number(pathname.split("/")[4]);
			const order = orders.find((item) => item.id === orderId);

			if (!order) {
				await route.fulfill(
					jsonResponse({ message: "Order not found" }, 404),
				);
				return;
			}

			const score = asNumber((body as { score?: unknown })?.score);
			const nextOrder = toProjectOrder({
				...order,
				clientRatingByFreelancer:
					currentUser?.role === "Freelancer"
						? score
						: order.clientRatingByFreelancer,
				freelancerRatingByClient:
					currentUser?.role === "Client"
						? score
						: order.freelancerRatingByClient,
				updatedAt: new Date().toISOString(),
			});

			replaceOrder(nextOrder);
			await route.fulfill(jsonResponse(cloneValue(nextOrder)));
			return;
		}

		await route.fulfill(
			jsonResponse(
				{
					message: `Unhandled mock route: ${method} ${pathname}`,
				},
				500,
			),
		);
	});

	return {
		requestLog,
		getCurrentUser: () => currentUser,
		setCurrentUser: (nextUser: User | null) => {
			currentUser = nextUser ? cloneValue(nextUser) : null;
		},
		clearRequestLog: () => {
			requestLog.length = 0;
		},
	};
}
