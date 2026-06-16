import { useEffect, useMemo, useState } from "react";
import {
	briefSections,
	budgetTypeLabels,
	calculateReadiness,
	formatBudget,
	formatDate,
	proposalStatusLabels,
	riskLevelLabels,
	scopeBucketLabels,
	useAuth,
	type AiBriefResult,
	type BudgetType,
	type BriefSectionKey,
	type ClarificationQuestion,
	type Currency,
	type DoneCriterion,
	type OrderStatus,
	type ProjectOrder,
	type ProjectProposal,
	type RiskLevel,
	type ScopeBucket,
	type ScopeItem,
} from "@/features";
import { ApiError } from "@/shared";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { StageBadge, StatusBadge } from "./components/StatusBadge";
import {
	acceptProposalRequest,
	clientMarkDone,
	clientMarkReject,
	createProposalRequest,
	freelancerMarkDone,
	rateOrderRequest,
	updateProjectClarificationQuestionsRequest,
	updateOrderApprovalRequest,
	withdrawProposalRequest,
} from "@/features/projects/projectsApi";

type ProjectWorkspacePageProps = {
	order: ProjectOrder;
	canEdit: boolean;
	onBack: () => void;
	onChange: (order: ProjectOrder) => Promise<void> | void;
};

const categories = ["Разработка", "Дизайн", "Маркетинг", "Контент"];
const currencies: Currency[] = ["RUB", "USD", "EUR"];
const budgetTypes: BudgetType[] = ["fixed", "hourly"];

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof ApiError) return error.message;
	return fallback;
}

function createLocalId() {
	return Date.now() + Math.floor(Math.random() * 1000);
}

function parseQuestionOptions(value: string) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function prepareOrder(order: ProjectOrder): ProjectOrder {
	const withCounters = {
		...order,
		proposalsCount: order.proposals.length,
	};
	return {
		...withCounters,
		readinessScore: calculateReadiness(withCounters),
	};
}

export default function ProjectWorkspacePage({
	order,
	canEdit,
	onBack,
	onChange,
}: ProjectWorkspacePageProps) {
	const { user } = useAuth();
	const [draft, setDraft] = useState(order);
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");
	const [formError, setFormError] = useState("");
	const [proposalMessage, setProposalMessage] = useState(
		"Здравствуйте! Готов обсудить задачу и взять проект в работу.",
	);
	const [proposalPrice, setProposalPrice] = useState(
		String(order.budgetMin || ""),
	);
	const [proposalDays, setProposalDays] = useState("14");
	const [ratingScore, setRatingScore] = useState("5");
	const [newQuestionText, setNewQuestionText] = useState("");
	const [newQuestionImportance, setNewQuestionImportance] =
		useState<RiskLevel>("medium");
	const [newQuestionOptions, setNewQuestionOptions] = useState("");

	const normalizedRole = String(user?.role ?? "").toLowerCase();
	const isAdmin = normalizedRole === "admin";
	const isOwner = canEdit;
	const isFreelancer = normalizedRole === "freelancer";
	const isClientParticipant = draft.hirerId === user?.id || isAdmin;
	const ownProposal = useMemo(
		() =>
			draft.proposals.find(
				(proposal) => proposal.freelancerId === user?.id,
			),
		[draft.proposals, user?.id],
	);
	const selectedProposal = draft.proposals.find(
		(proposal) => proposal.freelancerId === draft.selectedFreelancerId,
	);
	const isSelectedFreelancer = Boolean(
		(isFreelancer && draft.selectedFreelancerId === user?.id) ||
			(isAdmin && draft.selectedFreelancerId),
	);
	const canManageClarificationQuestions = isSelectedFreelancer;
	const isOrderParticipantFreelancer =
		draft.selectedFreelancerId === user?.id || isAdmin;
	const isCompletedOrder =
		draft.status === "Completed" || draft.completedAt !== null;
	const completionRequested =
		draft.approvals.freelancerDone || draft.approvals.clientDone;
	const canFreelancerMarkDone = Boolean(
		isSelectedFreelancer &&
		draft.status === "In_Progress" &&
		!draft.approvals.freelancerDone &&
		!isCompletedOrder,
	);
	const canClientAcceptCompletion = Boolean(
		isOwner &&
		draft.status === "In_Progress" &&
		draft.approvals.freelancerDone &&
		!draft.approvals.clientDone &&
		!isCompletedOrder,
	);
	const canClientRejectCompletion = canClientAcceptCompletion;
	const canPropose =
		isFreelancer &&
		draft.status === "Published" &&
		!draft.selectedFreelancerId &&
		!ownProposal;
	const canRateOrder = Boolean(
		isCompletedOrder &&
		draft.selectedFreelancerId &&
		(isClientParticipant || isOrderParticipantFreelancer),
	);
	const existingOwnRating = isClientParticipant
		? draft.freelancerRatingByClient
		: isOrderParticipantFreelancer
			? draft.clientRatingByFreelancer
			: null;
	const ratingTargetName = isClientParticipant
		? selectedProposal?.freelancerName ??
			draft.selectedFreelancerName ??
			"исполнителя"
		: draft.hirerName;
	const ratingTargetValue = isClientParticipant
		? draft.selectedFreelancerRating ?? 0
		: draft.hirerRating;
	const safeHirerRating = Number.isFinite(draft.hirerRating)
		? draft.hirerRating
		: 0;
	const safeRatingTargetValue = Number.isFinite(ratingTargetValue)
		? ratingTargetValue
		: 0;
	const completionStateKey = isCompletedOrder
		? "completed"
		: draft.approvals.freelancerDone
			? "awaiting_client"
			: "in_progress";
	const completionStateTitle =
		completionStateKey === "completed"
			? "Заказ завершён"
			: completionStateKey === "awaiting_client"
				? "Нужно решение заказчика"
				: "Работа ещё в процессе";
	const completionStateText =
		completionStateKey === "completed"
			? `Заказ закрыт${
					draft.completedAt
						? ` ${formatDate(draft.completedAt)}`
						: ""
				}. Теперь стороны могут оставить оценки по сотрудничеству.`
			: completionStateKey === "awaiting_client"
				? "Исполнитель уже отправил результат. Заказчик может принять работу или вернуть проект в работу."
				: "Когда исполнитель закончит задачу, он отправит результат на подтверждение, а заказчик примет финальное решение.";
	const completionProgress = isCompletedOrder
		? 3
		: draft.approvals.freelancerDone
			? 2
			: 1;
	const completionFreelancerLabel = draft.approvals.freelancerDone
		? "Отправлено"
		: canFreelancerMarkDone
			? "Можно отправлять"
			: "В работе";
	const completionClientLabel =
		isCompletedOrder || draft.approvals.clientDone
			? "Подтверждено"
			: draft.approvals.freelancerDone
				? "Нужно решение"
				: "Пока недоступно";

	useEffect(() => {
		setRatingScore(String(existingOwnRating ?? 5));
	}, [existingOwnRating]);

	const setDraftPatch = (patch: Partial<ProjectOrder>) => {
		setDraft((current) =>
			prepareOrder({
				...current,
				...patch,
				updatedAt: new Date().toISOString(),
			}),
		);
		setDirty(true);
		setSaveMessage("");
		setFormError("");
	};

	const applyServerOrder = (nextOrder: ProjectOrder, message: string) => {
		setDraft(prepareOrder(nextOrder));
		setDirty(false);
		setSaveMessage(message);
		setFormError("");
	};

	const commit = async (nextOrder: ProjectOrder, message = "Сохранено") => {
		setSaving(true);
		setFormError("");
		try {
			const next = prepareOrder(nextOrder);
			await onChange(next);
			setDraft(next);
			setDirty(false);
			setSaveMessage(message);
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось сохранить изменения"),
			);
		} finally {
			setSaving(false);
		}
	};

	const validateDraft = () => {
		if (draft.title.trim().length < 5)
			return "Название должно быть длиннее 5 символов";
		if (draft.rawDescription.trim().length < 30)
			return "Описание должно быть подробнее";
		if (draft.budgetMin < 0 || draft.budgetMax < 0)
			return "Бюджет не может быть отрицательным";
		if (draft.budgetMax < draft.budgetMin)
			return "Цена до не может быть меньше цены от";
		if (!draft.skills.length) return "Добавьте хотя бы один навык";
		return "";
	};

	const saveDraft = async () => {
		const error = validateDraft();
		if (error) {
			setFormError(error);
			return;
		}
		await commit(draft);
	};

	const cancelDraft = () => {
		setDraft(order);
		setDirty(false);
		setFormError("");
		setSaveMessage("");
	};

	const updateDescription = (rawDescription: string) => {
		setDraftPatch({
			rawDescription,
			shortDescription: rawDescription.slice(0, 150),
		});
	};

	const saveSkills = (value: string) => {
		setDraftPatch({
			skills: value
				.split(",")
				.map((skill) => skill.trim())
				.filter(Boolean),
		});
	};

	const updateBrief = (key: BriefSectionKey, value: string) => {
		setDraftPatch({
			briefSections: { ...draft.briefSections, [key]: value },
			workflowStage: "brief",
		});
	};

	const updateScopeItem = (id: number, patch: Partial<ScopeItem>) => {
		setDraftPatch({
			scopeItems: draft.scopeItems.map((item) =>
				item.id === id ? { ...item, ...patch } : item,
			),
			workflowStage: "brief",
		});
	};

	const addScopeItem = (bucket: ScopeBucket) => {
		setDraftPatch({
			scopeItems: [
				...draft.scopeItems,
				{
					id: createLocalId(),
					title: "",
					description: "",
					bucket,
				},
			],
			workflowStage: "brief",
		});
	};

	const removeScopeItem = (id: number) => {
		setDraftPatch({
			scopeItems: draft.scopeItems.filter((item) => item.id !== id),
			workflowStage: "brief",
		});
	};

	const updateDoneCriterion = (
		id: number,
		patch: Partial<DoneCriterion>,
	) => {
		setDraftPatch({
			doneCriteria: draft.doneCriteria.map((item) =>
				item.id === id ? { ...item, ...patch } : item,
			),
			workflowStage: "brief",
		});
	};

	const addDoneCriterion = () => {
		setDraftPatch({
			doneCriteria: [
				...draft.doneCriteria,
				{
					id: createLocalId(),
					text: "",
					checked: false,
				},
			],
			workflowStage: "brief",
		});
	};

	const removeDoneCriterion = (id: number) => {
		setDraftPatch({
			doneCriteria: draft.doneCriteria.filter((item) => item.id !== id),
			workflowStage: "brief",
		});
	};

	const setStatus = async (status: OrderStatus) => {
		const publishedAt =
			status === "Published"
				? (draft.publishedAt ?? new Date().toISOString())
				: draft.publishedAt;
		await commit(
			prepareOrder({
				...draft,
				status,
				publishedAt,
				updatedAt: new Date().toISOString(),
			}),
			"Статус обновлён",
		);
	};

	const selectProposal = async (proposal: ProjectProposal) => {
		if (!isOwner) return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await acceptProposalRequest(proposal.id);
			applyServerOrder(nextOrder, "Исполнитель выбран");
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось выбрать исполнителя"),
			);
		} finally {
			setSaving(false);
		}
	};

	const submitProposal = async () => {
		if (!user || !canPropose) return;

		const price = Number(proposalPrice) || 0;
		const estimatedDays = Number(proposalDays) || 0;

		if (
			proposalMessage.trim().length < 20 ||
			price <= 0 ||
			estimatedDays <= 0
		) {
			setFormError("Заполните сообщение, стоимость и срок отклика");
			return;
		}

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextProject = await createProposalRequest({
				orderId: draft.id,
				price,
				message: proposalMessage,
				estimatedDays,
			});

			setDraft(prepareOrder(nextProject));
			setDirty(false);
			setSaveMessage("Отклик отправлен");
		} catch (error) {
			setFormError(getErrorMessage(error, "Не удалось отправить отклик"));
		} finally {
			setSaving(false);
		}
	};

	// const submitProposal = async () => {
	// 	if (!user || !canPropose) return;
	// 	const price = Number(proposalPrice) || 0;
	// 	const estimatedDays = Number(proposalDays) || 0;
	// 	if (
	// 		proposalMessage.trim().length < 20 ||
	// 		price <= 0 ||
	// 		estimatedDays <= 0
	// 	) {
	// 		setFormError("Заполните сообщение, стоимость и срок отклика");
	// 		return;
	// 	}

	// 	const proposal: ProjectProposal = {
	// 		id: Date.now(),
	// 		projectId: draft.id,
	// 		freelancerId: user.id,
	// 		freelancerName: user.fullName,
	// 		message: proposalMessage,
	// 		price,
	// 		currency: draft.currency,
	// 		estimatedDays,
	// 		status: "pending",
	// 		createdAt: new Date().toISOString(),
	// 	};

	// 	await commit(
	// 		prepareOrder({
	// 			...draft,
	// 			proposals: [proposal, ...draft.proposals],
	// 			updatedAt: new Date().toISOString(),
	// 		}),
	// 		"Отклик отправлен",
	// 	);
	// };

	const withdrawProposal = async () => {
		if (!ownProposal || ownProposal.status !== "pending") return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await withdrawProposalRequest(ownProposal.id);
			applyServerOrder(nextOrder, "Отклик отозван");
		} catch (error) {
			setFormError(getErrorMessage(error, "Не удалось отозвать отклик"));
		} finally {
			setSaving(false);
		}
	};

	const toggleApproval = async (side: "client" | "freelancer") => {
		if (side === "client" && !isOwner) return;
		if (side === "freelancer" && !isSelectedFreelancer) return;
		if (!draft.selectedFreelancerId) return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await updateOrderApprovalRequest(
				draft.id,
				side,
				!draft.approvals[side],
			);
			applyServerOrder(
				nextOrder,
				nextOrder.status === "In_Progress"
					? "Заказ перешёл в работу"
					: "Подтверждение обновлено",
			);
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось обновить подтверждение"),
			);
		} finally {
			setSaving(false);
		}
	};

	const submitCompletionByFreelancer = async () => {
		if (!canFreelancerMarkDone) return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await freelancerMarkDone(draft.id);
			applyServerOrder(nextOrder, "Готовность отправлена заказчику");
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось отправить заказ на подтверждение"),
			);
		} finally {
			setSaving(false);
		}
	};

	const acceptCompletion = async () => {
		if (!canClientAcceptCompletion) return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await clientMarkDone(draft.id);
			applyServerOrder(nextOrder, "Заказ завершён");
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось подтвердить завершение"),
			);
		} finally {
			setSaving(false);
		}
	};

	const rejectCompletion = async () => {
		if (!canClientRejectCompletion) return;

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await clientMarkReject(draft.id);
			applyServerOrder(nextOrder, "Проект возвращён в работу");
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось вернуть проект в работу"),
			);
		} finally {
			setSaving(false);
		}
	};

	const applyAiResult = (result: AiBriefResult) => {
		setDraftPatch({
			technicalSpecification: result.summary,
			briefSections: result.briefSections,
			clarificationQuestions: result.questions,
			scopeItems: result.scopeItems,
			doneCriteria: result.doneCriteria,
			risks: result.risks,
			aiGenerated: true,
			workflowStage: "brief",
		});
	};

	const submitClarificationQuestion = async () => {
		if (!canManageClarificationQuestions) {
			return;
		}

		if (newQuestionText.trim().length < 10) {
			setFormError("Вопрос должен быть чуть подробнее");
			return;
		}

		const nextQuestions: ClarificationQuestion[] = [
			...draft.clarificationQuestions,
			{
				id: createLocalId(),
				question: newQuestionText.trim(),
				importance: newQuestionImportance,
				answer: "",
				options: parseQuestionOptions(newQuestionOptions),
			},
		];

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await updateProjectClarificationQuestionsRequest(
				draft.id,
				nextQuestions,
			);
			applyServerOrder(nextOrder, "Вопрос сохранён");
			setNewQuestionText("");
			setNewQuestionImportance("medium");
			setNewQuestionOptions("");
		} catch (error) {
			setFormError(
				getErrorMessage(error, "Не удалось сохранить вопрос"),
			);
		} finally {
			setSaving(false);
		}
	};

	const submitRating = async () => {
		if (!canRateOrder) {
			return;
		}

		const score = Number(ratingScore);

		if (!Number.isInteger(score) || score < 1 || score > 5) {
			setFormError("Выберите оценку от 1 до 5");
			return;
		}

		setSaving(true);
		setFormError("");
		setSaveMessage("");

		try {
			const nextOrder = await rateOrderRequest(draft.id, score);
			applyServerOrder(nextOrder, "Оценка сохранена");
		} catch (error) {
			setFormError(getErrorMessage(error, "Не удалось сохранить оценку"));
		} finally {
			setSaving(false);
		}
	};

	return (
		<main className="orders-page order-details-page">
			<button type="button" className="hm-link-button" onClick={onBack}>
				Посмотреть другие заказы
			</button>

			<section className="order-details-head">
				{isOwner ? (
					<label className="detail-field detail-field--title">
						<span>Название заказа</span>
						<input
							className="detail-title-input"
							value={draft.title}
							onChange={(event) =>
								setDraftPatch({ title: event.target.value })
							}
						/>
					</label>
				) : (
					<h1>{draft.title}</h1>
				)}
				<a href={`/projects/${draft.id}`}>Ссылка на заказ</a>
				<div className="order-details-badges">
					<StatusBadge status={draft.status} />
					<StageBadge stage={draft.workflowStage} />
					{draft.approvals.freelancerDone && !isCompletedOrder ? (
						<span className="hm-badge hm-badge--stage">
							Ожидает приёмки
						</span>
					) : null}
					{draft.selectedFreelancerName ? (
						<span className="hm-badge hm-badge--stage">
							{draft.selectedFreelancerName}
						</span>
					) : null}
					{isAdmin ? (
						<span className="hm-badge hm-badge--ai">Админ-режим</span>
					) : null}
					{canManageClarificationQuestions ? (
						<span className="hm-badge hm-badge--stage">
							Может задавать вопросы
						</span>
					) : !isOwner ? (
						<span className="hm-badge hm-badge--stage">
							Только просмотр
						</span>
					) : null}
				</div>
			</section>

			{isOwner ? (
				<section className="order-actionbar">
					{draft.status === "Draft" ? (
						<button
							type="button"
							className="hm-button"
							onClick={() => void setStatus("Published")}
						>
							Опубликовать
						</button>
					) : null}
					{draft.status === "Published" ? (
						<button
							type="button"
							className="hm-button"
							onClick={() => void setStatus("Paused")}
						>
							Поставить на паузу
						</button>
					) : null}
					{draft.status === "Paused" ? (
						<button
							type="button"
							className="hm-button"
							onClick={() => void setStatus("Published")}
						>
							Вернуть в публикацию
						</button>
					) : null}
					{draft.status !== "Archived" ? (
						<button
							type="button"
							className="hm-button hm-button--ghost"
							onClick={() => void setStatus("Archived")}
						>
							В архив
						</button>
					) : null}
					{draft.status === "Archived" ? (
						<button
							type="button"
							className="hm-button"
							onClick={() => void setStatus("Published")}
						>
							Восстановить
						</button>
					) : null}
				</section>
			) : null}

			{(draft.status === "In_Progress" || completionRequested || isCompletedOrder) &&
			draft.selectedFreelancerId ? (
				<section className="order-section order-section--completion">
					<div className="section-head section-head--completion">
						<div>
							<h2>Завершение заказа</h2>
							<p className="section-lead">
								Финальная приёмка проходит в два шага: сначала
								исполнитель отправляет результат, затем заказчик
								подтверждает завершение.
							</p>
						</div>
						<span
							className={`completion-pill completion-pill--${completionStateKey}`}
						>
							{completionStateTitle}
						</span>
					</div>

					<div className="completion-shell">
						<div className="completion-overview">
							<div className="completion-overview__copy">
								<span className="hm-kicker">Статус приёмки</span>
								<strong>{completionStateTitle}</strong>
								<p>{completionStateText}</p>
							</div>
							<div className="completion-overview__meta">
								<div>
									<span>Исполнитель</span>
									<strong>
										{selectedProposal?.freelancerName ??
											draft.selectedFreelancerName ??
											"Исполнитель"}
									</strong>
								</div>
								<div>
									<span>Финальный статус</span>
									<strong>
										{isCompletedOrder && draft.completedAt
											? formatDate(draft.completedAt)
											: "После решения заказчика"}
									</strong>
								</div>
							</div>
						</div>

						<div className="completion-steps" aria-label="Этапы завершения">
							<article
								className={
									completionProgress > 1
										? "completion-step completion-step--done"
										: "completion-step completion-step--active"
								}
							>
								<span className="completion-step__index">1</span>
								<div>
									<strong>Работа в процессе</strong>
									<p>
										Исполнитель завершает задачу и готовит
										результат к сдаче.
									</p>
								</div>
							</article>
							<article
								className={
									completionProgress > 2
										? "completion-step completion-step--done"
										: completionProgress === 2
											? "completion-step completion-step--active"
											: "completion-step"
								}
							>
								<span className="completion-step__index">2</span>
								<div>
									<strong>Отправка на приёмку</strong>
									<p>
										Исполнитель нажимает завершение, и заказ
										переходит в ожидание решения заказчика.
									</p>
								</div>
							</article>
							<article
								className={
									completionProgress === 3
										? "completion-step completion-step--done"
										: "completion-step"
								}
							>
								<span className="completion-step__index">3</span>
								<div>
									<strong>Решение заказчика</strong>
									<p>
										Заказчик подтверждает завершение или
										возвращает проект в работу.
									</p>
								</div>
							</article>
						</div>

						<div className="completion-grid">
							<article className="completion-card">
								<div className="completion-card__head">
									<div>
										<span className="completion-card__role">
											Исполнитель
										</span>
										<strong>
											{selectedProposal?.freelancerName ??
												draft.selectedFreelancerName ??
												"Исполнитель"}
										</strong>
									</div>
									<span
										className={`completion-card__badge ${
											draft.approvals.freelancerDone
												? "completion-card__badge--done"
												: canFreelancerMarkDone
													? "completion-card__badge--action"
													: "completion-card__badge--waiting"
										}`}
									>
										{completionFreelancerLabel}
									</span>
								</div>
								<p className="completion-state">
									{draft.approvals.freelancerDone
										? "Исполнитель отметил заказ как готовый и ждёт финального решения заказчика."
										: "После завершения работы исполнитель отправляет заказ на подтверждение одним действием."}
								</p>
								<div className="completion-card__footer">
									{canFreelancerMarkDone ? (
										<button
											type="button"
											className="hm-button"
											onClick={() =>
												void submitCompletionByFreelancer()
											}
											disabled={saving}
										>
											Отправить на подтверждение
										</button>
									) : isSelectedFreelancer &&
									  draft.approvals.freelancerDone &&
									  !isCompletedOrder ? (
										<span className="detail-note">
											Ожидаем решение заказчика
										</span>
									) : (
										<span className="detail-note">
											Отправить результат может только выбранный
											исполнитель
										</span>
									)}
								</div>
							</article>

							<article className="completion-card">
								<div className="completion-card__head">
									<div>
										<span className="completion-card__role">
											Заказчик
										</span>
										<strong>{draft.hirerName}</strong>
									</div>
									<span
										className={`completion-card__badge ${
											isCompletedOrder || draft.approvals.clientDone
												? "completion-card__badge--done"
												: draft.approvals.freelancerDone
													? "completion-card__badge--action"
													: "completion-card__badge--waiting"
										}`}
									>
										{completionClientLabel}
									</span>
								</div>
								<p className="completion-state">
									{isCompletedOrder || draft.approvals.clientDone
										? "Заказчик подтвердил завершение. Проект считается закрытым."
										: draft.approvals.freelancerDone
											? "Заказчик может принять результат или вернуть проект в работу без изменения основной карточки заказа."
											: "Кнопки подтверждения появятся после того, как исполнитель отметит заказ готовым."}
								</p>
								<div className="completion-card__footer">
									{canClientAcceptCompletion ? (
										<div className="completion-actions">
											<button
												type="button"
												className="hm-button"
												onClick={() => void acceptCompletion()}
												disabled={saving}
											>
												Подтвердить завершение
											</button>
											<button
												type="button"
												className="hm-button hm-button--ghost"
												onClick={() => void rejectCompletion()}
												disabled={saving}
											>
												Вернуть в работу
											</button>
										</div>
									) : draft.approvals.freelancerDone &&
									  !isOwner &&
									  !isCompletedOrder ? (
										<span className="detail-note">
											Ожидаем подтверждение заказчика
										</span>
									) : (
										<span className="detail-note">
											Финальное решение принимает заказчик
										</span>
									)}
								</div>
							</article>
						</div>
					</div>
				</section>
			) : null}

			{canRateOrder ? (
				<section className="order-section">
					<h2>Оценка сотрудничества</h2>
					<div className="detail-item rating-panel">
						<strong>
							{isClientParticipant
								? "Оцените исполнителя"
								: "Оцените заказчика"}
						</strong>
						<p>
							{ratingTargetName} · текущий рейтинг{" "}
							{safeRatingTargetValue.toFixed(1)} / 5
						</p>
						<div
							className="rating-row"
							role="radiogroup"
							aria-label="Оценка"
						>
							{[1, 2, 3, 4, 5].map((value) => (
								<button
									key={value}
									type="button"
									className={
										Number(ratingScore) === value
											? "rating-chip rating-chip--active"
											: "rating-chip"
									}
									onClick={() => setRatingScore(String(value))}
									disabled={saving}
								>
									{value}
								</button>
							))}
						</div>
						<div className="rating-summary">
							<span>
								{existingOwnRating !== null
									? `Ваша оценка: ${existingOwnRating} / 5`
									: "Оценка пока не выставлена"}
							</span>
							<button
								type="button"
								className="hm-button"
								onClick={() => void submitRating()}
								disabled={saving}
							>
								{existingOwnRating !== null
									? "Обновить оценку"
									: "Подтвердить оценку"}
							</button>
						</div>
					</div>
				</section>
			) : null}

			{isOwner && dirty ? (
				<section className="save-panel">
					<span>Есть несохранённые изменения</span>
					<div>
						<button
							type="button"
							className="hm-button"
							onClick={() => void saveDraft()}
							disabled={saving}
						>
							{saving ? "Сохраняем..." : "Сохранить"}
						</button>
						<button
							type="button"
							className="hm-button hm-button--ghost"
							onClick={cancelDraft}
							disabled={saving}
						>
							Отменить
						</button>
					</div>
				</section>
			) : null}

			<section className="order-description">
				{isOwner ? (
					<label className="detail-field detail-field--description">
						<span>Описание заказа</span>
						<textarea
							value={draft.rawDescription}
							onChange={(event) =>
								updateDescription(event.target.value)
							}
						/>
					</label>
				) : (
					<p>{draft.rawDescription || draft.shortDescription}</p>
				)}
				<span>
					Опубликован {formatDate(draft.publishedAt)} · обновлён{" "}
					{formatDate(draft.updatedAt)}
				</span>
			</section>

			<section className="order-section">
				<h2>Техническое задание</h2>
				{isOwner ? (
					<label className="detail-field">
						<span>Сводка и требования</span>
						<textarea
							value={draft.technicalSpecification}
							onChange={(event) =>
								setDraftPatch({
									technicalSpecification: event.target.value,
									workflowStage: "brief",
								})
							}
						/>
					</label>
				) : (
					<p>{draft.technicalSpecification || "Пока не заполнено"}</p>
				)}
			</section>

			<section className="order-info-grid">
				<div>
					<span>Бюджет</span>
					{isOwner ? (
						<div className="budget-edit">
							<input
								value={draft.budgetMin || ""}
								onChange={(event) =>
									setDraftPatch({
										budgetMin:
											Number(event.target.value) || 0,
									})
								}
								placeholder="Цена от"
								inputMode="numeric"
							/>
							<input
								value={draft.budgetMax || ""}
								onChange={(event) =>
									setDraftPatch({
										budgetMax:
											Number(event.target.value) || 0,
									})
								}
								placeholder="Цена до"
								inputMode="numeric"
							/>
						</div>
					) : (
						<strong>{formatBudget(draft)}</strong>
					)}
				</div>
				<div>
					<span>Валюта</span>
					{isOwner ? (
						<select
							value={draft.currency}
							onChange={(event) =>
								setDraftPatch({
									currency: event.target.value as Currency,
								})
							}
						>
							{currencies.map((currency) => (
								<option key={currency} value={currency}>
									{currency}
								</option>
							))}
						</select>
					) : (
						<strong>{draft.currency}</strong>
					)}
				</div>
				<div>
					<span>Тип бюджета</span>
					{isOwner ? (
						<select
							value={draft.budgetType}
							onChange={(event) =>
								setDraftPatch({
									budgetType: event.target
										.value as BudgetType,
								})
							}
						>
							{budgetTypes.map((type) => (
								<option key={type} value={type}>
									{budgetTypeLabels[type]}
								</option>
							))}
						</select>
					) : (
						<strong>{budgetTypeLabels[draft.budgetType]}</strong>
					)}
				</div>
				<div>
					<span>Заказчик</span>
					<strong>{draft.hirerName}</strong>
				</div>
				<div>
					<span>Рейтинг заказчика</span>
					<strong>{safeHirerRating.toFixed(1)} / 5</strong>
				</div>
				<div>
					<span>Компания</span>
					<strong>{draft.companyName}</strong>
				</div>
				<div>
					<span>Категория</span>
					{isOwner ? (
						<select
							value={draft.category}
							onChange={(event) =>
								setDraftPatch({ category: event.target.value })
							}
						>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					) : (
						<strong>{draft.category}</strong>
					)}
				</div>
				<div>
					<span>Готовность ТЗ</span>
					<strong>{draft.readinessScore}%</strong>
				</div>
			</section>

			<section className="order-section">
				<h2>Навыки</h2>
				{isOwner ? (
					<label className="detail-field">
						<span>Требуемые навыки через запятую</span>
						<input
							key={`${draft.id}-${draft.skills.join(",")}`}
							defaultValue={draft.skills.join(", ")}
							onBlur={(event) => saveSkills(event.target.value)}
						/>
					</label>
				) : (
					<div className="order-row__skills">
						{draft.skills.map((skill) => (
							<span key={skill}>{skill}</span>
						))}
					</div>
				)}
			</section>

			<section className="order-section">
				<h2>Отклики</h2>
				{isOwner ? (
					<div className="proposal-list">
						{draft.proposals.length ? (
							draft.proposals.map((proposal) => (
								<article
									key={proposal.id}
									className="detail-item proposal-item"
								>
									<strong>{proposal.freelancerName}</strong>
									<span>
										{proposalStatusLabels[proposal.status]}
									</span>
									<p>{proposal.message}</p>
									<p>
										{proposal.price} {proposal.currency} ·{" "}
										{proposal.estimatedDays} дн.
									</p>
									{proposal.status === "pending" &&
									!draft.selectedFreelancerId ? (
										<button
											type="button"
											className="hm-button"
											onClick={() =>
												void selectProposal(proposal)
											}
										>
											Выбрать исполнителя
										</button>
									) : null}
								</article>
							))
						) : (
							<p className="detail-note">Пока нет откликов</p>
						)}
					</div>
				) : null}

				{canPropose ? (
					<div className="proposal-form">
						<label className="detail-field">
							<span>Сообщение заказчику</span>
							<textarea
								value={proposalMessage}
								onChange={(event) =>
									setProposalMessage(event.target.value)
								}
							/>
						</label>
						<div className="create-form__row">
							<input
								value={proposalPrice}
								onChange={(event) =>
									setProposalPrice(event.target.value)
								}
								placeholder="Стоимость"
								inputMode="numeric"
							/>
							<input
								value={proposalDays}
								onChange={(event) =>
									setProposalDays(event.target.value)
								}
								placeholder="Срок в днях"
								inputMode="numeric"
							/>
						</div>
						<button
							type="button"
							className="hm-button"
							onClick={() => void submitProposal()}
							disabled={saving}
						>
							Откликнуться
						</button>
					</div>
				) : null}

				{isFreelancer && ownProposal ? (
					<article className="detail-item proposal-item">
						<strong>Ваш отклик</strong>
						<span>{proposalStatusLabels[ownProposal.status]}</span>
						<p>{ownProposal.message}</p>
						{ownProposal.status === "pending" ? (
							<button
								type="button"
								className="hm-button hm-button--ghost"
								onClick={() => void withdrawProposal()}
							>
								Отозвать отклик
							</button>
						) : null}
					</article>
				) : null}
			</section>

			<section className="order-section">
				<h2>Описание и бриф</h2>
				{briefSections.map((section) => (
					<label key={section.key} className="detail-field">
						<span>{section.title}</span>
						{isOwner ? (
							<textarea
								value={draft.briefSections[section.key]}
								onChange={(event) =>
									updateBrief(section.key, event.target.value)
								}
							/>
						) : (
							<p>{draft.briefSections[section.key]}</p>
						)}
					</label>
				))}
			</section>

			<section className="order-section">
				<h2>Уточняющие вопросы</h2>
				{draft.clarificationQuestions.map((question) => (
					<article key={question.id} className="detail-item">
						<strong>{question.question}</strong>
						<span>{riskLevelLabels[question.importance]}</span>
						{question.options.length ? (
							<p>Варианты: {question.options.join(", ")}</p>
						) : null}
						{isOwner ? (
							<textarea
								value={question.answer}
								placeholder="Ответ"
								onChange={(event) =>
									setDraftPatch({
										clarificationQuestions:
											draft.clarificationQuestions.map(
												(item) =>
													item.id === question.id
														? {
																...item,
																answer: event
																	.target
																	.value,
															}
														: item,
											),
										workflowStage: "clarification",
									})
								}
							/>
						) : (
							<p>{question.answer || "Пока нет ответа"}</p>
						)}
					</article>
				))}
				{canManageClarificationQuestions ? (
					<div className="detail-item clarification-form">
						<strong>Добавить уточняющий вопрос</strong>
						<textarea
							value={newQuestionText}
							onChange={(event) =>
								setNewQuestionText(event.target.value)
							}
							placeholder="Что нужно уточнить у заказчика?"
						/>
						<div className="clarification-form__row">
							<select
								value={newQuestionImportance}
								onChange={(event) =>
									setNewQuestionImportance(
										event.target.value as RiskLevel,
									)
								}
							>
								<option value="low">Низкий приоритет</option>
								<option value="medium">
									Средний приоритет
								</option>
								<option value="high">Высокий приоритет</option>
							</select>
							<input
								value={newQuestionOptions}
								onChange={(event) =>
									setNewQuestionOptions(event.target.value)
								}
								placeholder="Варианты ответа через запятую"
							/>
						</div>
						<button
							type="button"
							className="hm-button"
							onClick={() => void submitClarificationQuestion()}
							disabled={saving}
						>
							{saving ? "Сохраняем..." : "Добавить вопрос"}
						</button>
					</div>
				) : null}
			</section>

			<section className="order-section">
				<h2>Scope</h2>
				{(["included", "excluded", "later"] as ScopeBucket[]).map(
					(bucket) => (
						<div key={bucket} className="scope-line">
							<h3>{scopeBucketLabels[bucket]}</h3>
							{draft.scopeItems
								.filter((item) => item.bucket === bucket)
								.map((item) => (
									<div key={item.id} className="detail-item scope-item">
										{isOwner ? (
											<>
												<input
													value={item.title}
													onChange={(event) =>
														updateScopeItem(item.id, {
															title: event.target.value,
														})
													}
													placeholder="Название пункта"
												/>
												<textarea
													value={item.description}
													onChange={(event) =>
														updateScopeItem(item.id, {
															description:
																event.target.value,
														})
													}
													placeholder="Что именно сюда входит"
												/>
												<div className="scope-item__actions">
													<select
														value={item.bucket}
														onChange={(event) =>
															updateScopeItem(item.id, {
																bucket: event.target
																	.value as ScopeBucket,
															})
														}
													>
														<option value="included">
															В scope
														</option>
														<option value="excluded">
															Вне scope
														</option>
														<option value="later">
															Позже
														</option>
													</select>
													<button
														type="button"
														className="hm-button hm-button--ghost"
														onClick={() =>
															removeScopeItem(item.id)
														}
													>
														Удалить
													</button>
												</div>
											</>
										) : (
											<p>
												<strong>{item.title}</strong> —{" "}
												{item.description}
											</p>
										)}
									</div>
								))}
							{isOwner ? (
								<button
									type="button"
									className="hm-button hm-button--ghost"
									onClick={() => addScopeItem(bucket)}
								>
									Добавить пункт
								</button>
							) : null}
						</div>
					),
				)}
			</section>

			<section className="order-section">
				<h2>Definition of Done</h2>
				{draft.doneCriteria.map((criterion) => (
					<div key={criterion.id} className="detail-check detail-check--editable">
						<input
							type="checkbox"
							checked={criterion.checked}
							disabled={!isOwner}
							onChange={() =>
								updateDoneCriterion(criterion.id, {
									checked: !criterion.checked,
								})
							}
						/>
						{isOwner ? (
							<>
								<input
									value={criterion.text}
									onChange={(event) =>
										updateDoneCriterion(criterion.id, {
											text: event.target.value,
										})
									}
									placeholder="Проверяемый критерий готовности"
								/>
								<button
									type="button"
									className="hm-button hm-button--ghost"
									onClick={() =>
										removeDoneCriterion(criterion.id)
									}
								>
									Удалить
								</button>
							</>
						) : (
							<span>{criterion.text}</span>
						)}
					</div>
				))}
				{isOwner ? (
					<button
						type="button"
						className="hm-button hm-button--ghost"
						onClick={addDoneCriterion}
					>
						Добавить критерий
					</button>
				) : null}
			</section>

			<section className="order-section">
				<div className="section-head">
					<h2>Риски</h2>
					<span className="detail-note">AI-generated</span>
				</div>
				{draft.risks.map((risk) => (
					<article key={risk.id} className="detail-item">
						<strong>{risk.title}</strong>
						<span>{riskLevelLabels[risk.level]}</span>
						<p>{risk.impact}</p>
						<p>{risk.action}</p>
					</article>
				))}
			</section>

			{draft.selectedFreelancerId ? (
				<section className="order-section">
					<h2>Согласование</h2>
					<div className="approval-grid">
						<article className="detail-item">
							<strong>Заказчик</strong>
							<p>
								{draft.approvals.client
									? "Подтверждено"
									: "Ожидает подтверждения"}
							</p>
							{isOwner ? (
								<button
									type="button"
									className="hm-button"
									onClick={() =>
										void toggleApproval("client")
									}
									disabled={saving}
								>
									{draft.approvals.client
										? "Отменить"
										: "Подтвердить"}
								</button>
							) : null}
						</article>
						<article className="detail-item">
							<strong>
								{selectedProposal?.freelancerName ??
									"Фрилансер"}
							</strong>
							<p>
								{draft.approvals.freelancer
									? "Подтверждено"
									: "Ожидает подтверждения"}
							</p>
							{isSelectedFreelancer ? (
								<button
									type="button"
									className="hm-button"
									onClick={() =>
										void toggleApproval("freelancer")
									}
									disabled={saving}
								>
									{draft.approvals.freelancer
										? "Отменить"
										: "Подтвердить"}
								</button>
							) : (
								<span className="detail-note">
									Подтверждает выбранный фрилансер
								</span>
							)}
						</article>
					</div>
				</section>
			) : null}
			{formError ? <p className="form-error">{formError}</p> : null}
			{saveMessage ? <p className="form-success">{saveMessage}</p> : null}
			{isOwner ? (
				<AiAssistantPanel order={draft} onApply={applyAiResult} />
			) : null}
		</main>
	);
}
