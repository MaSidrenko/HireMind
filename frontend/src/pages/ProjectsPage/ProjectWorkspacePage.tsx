import { useMemo, useState } from "react";
// import {
// 	briefSections,
// 	budgetTypeLabels,
// 	calculateReadiness,
// 	formatBudget,
// 	formatDate,
// 	proposalStatusLabels,
// 	riskLevelLabels,
// 	scopeBucketLabels,
// 	useAuth,
// 	type AiBriefResult,
// 	type BudgetType,
// 	type BriefSectionKey,
// 	type Currency,
// 	type OrderStatus,
// 	type ProjectOrder,
// 	type ProjectProposal,
// 	type ScopeBucket,
// } from "@/features";
import { briefSections } from "@/features/projects/projectDictionaries";
import { budgetTypeLabels } from "@/features/projects/projectDictionaries";
import { calculateReadiness } from "@/features/projects/projectLogic";
import { formatBudget } from "@/features/projects/projectFormatters";
import { formatDate } from "@/features/projects/projectFormatters";
import { proposalStatusLabels } from "@/features/projects/projectDictionaries";
import { riskLevelLabels } from "@/features/projects/projectDictionaries";
import { scopeBucketLabels } from "@/features/projects/projectDictionaries";
import { useAuth } from "@/features";
import type { AiBriefResult } from "@/features/aiAssistant/types";
import type { BriefSectionKey, BudgetType } from "@/features/projects/types";
import type { Currency } from "@/features/projects/types";
import type { OrderStatus } from "@/features/projects/types";
import type { ProjectOrder } from "@/features/projects/types";
import type { ProjectProposal } from "@/features/projects/types";
import type { ScopeBucket } from "@/features/projects/types";
import { AiAssistantPanel } from "./components/AiAssistantPanel";
import { StageBadge, StatusBadge } from "./components/StatusBadge";

type ProjectWorkspacePageProps = {
	order: ProjectOrder;
	canEdit: boolean;
	onBack: () => void;
	onChange: (order: ProjectOrder) => Promise<void> | void;
};

const categories = ["Разработка", "Дизайн", "Маркетинг", "Контент"];
const currencies: Currency[] = ["RUB", "USD", "EUR"];
const budgetTypes: BudgetType[] = ["fixed", "hourly"];

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
	const [proposalMessage, setProposalMessage] = useState("Здравствуйте! Готов обсудить задачу и взять проект в работу.");
	const [proposalPrice, setProposalPrice] = useState(String(order.budgetMin || ""));
	const [proposalDays, setProposalDays] = useState("14");

	const isOwner = canEdit;
	const isFreelancer = user?.role === "freelancer";
	const ownProposal = useMemo(
		() => draft.proposals.find((proposal) => proposal.freelancerId === user?.id),
		[draft.proposals, user?.id],
	);
	const selectedProposal = draft.proposals.find(
		(proposal) => proposal.freelancerId === draft.selectedFreelancerId,
	);
	const isSelectedFreelancer = isFreelancer && draft.selectedFreelancerId === user?.id;
	const canPropose =
		isFreelancer &&
		draft.status === "published" &&
		!draft.selectedFreelancerId &&
		!ownProposal;

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

	const commit = async (nextOrder: ProjectOrder, message = "Сохранено") => {
		setSaving(true);
		setFormError("");
		try {
			const next = prepareOrder(nextOrder);
			await onChange(next);
			setDraft(next);
			setDirty(false);
			setSaveMessage(message);
		} catch {
			setFormError("Не удалось сохранить изменения");
		} finally {
			setSaving(false);
		}
	};

	const validateDraft = () => {
		if (draft.title.trim().length < 5) return "Название должно быть длиннее 5 символов";
		if (draft.rawDescription.trim().length < 30) return "Описание должно быть подробнее";
		if (draft.budgetMin < 0 || draft.budgetMax < 0) return "Бюджет не может быть отрицательным";
		if (draft.budgetMax < draft.budgetMin) return "Цена до не может быть меньше цены от";
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
			skills: value.split(",").map((skill) => skill.trim()).filter(Boolean),
		});
	};

	const updateBrief = (key: BriefSectionKey, value: string) => {
		setDraftPatch({
			briefSections: { ...draft.briefSections, [key]: value },
			workflowStage: "brief",
		});
	};

	const setStatus = async (status: OrderStatus) => {
		const publishedAt = status === "published" ? draft.publishedAt ?? new Date().toISOString() : draft.publishedAt;
		await commit(
			prepareOrder({
				...draft,
				status,
				publishedAt,
				workflowStage: status === "in_progress" || status === "completed" ? "approved" : draft.workflowStage,
				updatedAt: new Date().toISOString(),
			}),
			"Статус обновлён",
		);
	};

	const selectProposal = async (proposal: ProjectProposal) => {
		if (!isOwner) return;
		await commit(
			prepareOrder({
				...draft,
				selectedFreelancerId: proposal.freelancerId,
				selectedFreelancerName: proposal.freelancerName,
				proposals: draft.proposals.map((item) => ({
					...item,
					status: item.id === proposal.id ? "accepted" : "declined",
				})),
				approvals: { client: false, freelancer: false },
				workflowStage: "review",
				updatedAt: new Date().toISOString(),
			}),
			"Исполнитель выбран",
		);
	};

	const submitProposal = async () => {
		if (!user || !canPropose) return;
		const price = Number(proposalPrice) || 0;
		const estimatedDays = Number(proposalDays) || 0;
		if (proposalMessage.trim().length < 20 || price <= 0 || estimatedDays <= 0) {
			setFormError("Заполните сообщение, стоимость и срок отклика");
			return;
		}

		const proposal: ProjectProposal = {
			id: Date.now(),
			projectId: draft.id,
			freelancerId: user.id,
			freelancerName: user.fullName,
			message: proposalMessage,
			price,
			currency: draft.currency,
			estimatedDays,
			status: "pending",
			createdAt: new Date().toISOString(),
		};

		await commit(
			prepareOrder({
				...draft,
				proposals: [proposal, ...draft.proposals],
				updatedAt: new Date().toISOString(),
			}),
			"Отклик отправлен",
		);
	};

	const withdrawProposal = async () => {
		if (!ownProposal || ownProposal.status !== "pending") return;
		await commit(
			prepareOrder({
				...draft,
				proposals: draft.proposals.map((proposal) =>
					proposal.id === ownProposal.id
						? { ...proposal, status: "withdrawn" }
						: proposal,
				),
				updatedAt: new Date().toISOString(),
			}),
			"Отклик отозван",
		);
	};

	const toggleApproval = async (side: "client" | "freelancer") => {
		if (side === "client" && !isOwner) return;
		if (side === "freelancer" && !isSelectedFreelancer) return;
		if (!draft.selectedFreelancerId) return;

		const approvals = { ...draft.approvals, [side]: !draft.approvals[side] };
		const approved = approvals.client && approvals.freelancer;
		await commit(
			prepareOrder({
				...draft,
				approvals,
				status: approved ? "in_progress" : draft.status === "in_progress" ? "published" : draft.status,
				workflowStage: approved ? "approved" : "review",
				publishedAt: draft.publishedAt ?? new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}),
			approved ? "Заказ перешёл в работу" : "Подтверждение обновлено",
		);
	};

	const applyAiResult = (result: AiBriefResult) => {
		setDraftPatch({
			briefSections: result.briefSections,
			clarificationQuestions: result.questions,
			risks: result.risks,
			aiGenerated: true,
			workflowStage: "brief",
		});
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
							onChange={(event) => setDraftPatch({ title: event.target.value })}
						/>
					</label>
				) : (
					<h1>{draft.title}</h1>
				)}
				<a href={`/projects/${draft.id}`}>Ссылка на заказ</a>
				<div className="order-details-badges">
					<StatusBadge status={draft.status} />
					<StageBadge stage={draft.workflowStage} />
					{draft.selectedFreelancerName ? <span className="hm-badge hm-badge--stage">{draft.selectedFreelancerName}</span> : null}
					{!isOwner ? <span className="hm-badge hm-badge--stage">Только просмотр</span> : null}
				</div>
			</section>

			{isOwner ? (
				<section className="order-actionbar">
					{draft.status === "draft" ? <button type="button" className="hm-button" onClick={() => void setStatus("published")}>Опубликовать</button> : null}
					{draft.status === "published" ? <button type="button" className="hm-button" onClick={() => void setStatus("paused")}>Поставить на паузу</button> : null}
					{draft.status === "paused" ? <button type="button" className="hm-button" onClick={() => void setStatus("published")}>Вернуть в публикацию</button> : null}
					{draft.status === "in_progress" ? <button type="button" className="hm-button" onClick={() => void setStatus("completed")}>Завершить</button> : null}
					{draft.status !== "archived" ? <button type="button" className="hm-button hm-button--ghost" onClick={() => void setStatus("archived")}>В архив</button> : null}
					{draft.status === "archived" ? <button type="button" className="hm-button" onClick={() => void setStatus("published")}>Восстановить</button> : null}
				</section>
			) : null}

			{isOwner && dirty ? (
				<section className="save-panel">
					<span>Есть несохранённые изменения</span>
					<div>
						<button type="button" className="hm-button" onClick={() => void saveDraft()} disabled={saving}>
							{saving ? "Сохраняем..." : "Сохранить"}
						</button>
						<button type="button" className="hm-button hm-button--ghost" onClick={cancelDraft} disabled={saving}>
							Отменить
						</button>
					</div>
				</section>
			) : null}
			{formError ? <p className="form-error">{formError}</p> : null}
			{saveMessage ? <p className="form-success">{saveMessage}</p> : null}

			<section className="order-description">
				{isOwner ? (
					<label className="detail-field detail-field--description">
						<span>Описание заказа</span>
						<textarea
							value={draft.rawDescription}
							onChange={(event) => updateDescription(event.target.value)}
						/>
					</label>
				) : (
					<p>{draft.rawDescription || draft.shortDescription}</p>
				)}
				<span>Опубликован {formatDate(draft.publishedAt)} · обновлён {formatDate(draft.updatedAt)}</span>
			</section>

			<section className="order-info-grid">
				<div>
					<span>Бюджет</span>
					{isOwner ? (
						<div className="budget-edit">
							<input
								value={draft.budgetMin || ""}
								onChange={(event) => setDraftPatch({ budgetMin: Number(event.target.value) || 0 })}
								placeholder="Цена от"
								inputMode="numeric"
							/>
							<input
								value={draft.budgetMax || ""}
								onChange={(event) => setDraftPatch({ budgetMax: Number(event.target.value) || 0 })}
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
						<select value={draft.currency} onChange={(event) => setDraftPatch({ currency: event.target.value as Currency })}>
							{currencies.map((currency) => (
								<option key={currency} value={currency}>{currency}</option>
							))}
						</select>
					) : (
						<strong>{draft.currency}</strong>
					)}
				</div>
				<div>
					<span>Тип бюджета</span>
					{isOwner ? (
						<select value={draft.budgetType} onChange={(event) => setDraftPatch({ budgetType: event.target.value as BudgetType })}>
							{budgetTypes.map((type) => (
								<option key={type} value={type}>{budgetTypeLabels[type]}</option>
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
					<span>Компания</span>
					{isOwner ? (
						<input value={draft.companyName} onChange={(event) => setDraftPatch({ companyName: event.target.value })} />
					) : (
						<strong>{draft.companyName}</strong>
					)}
				</div>
				<div>
					<span>Категория</span>
					{isOwner ? (
						<select value={draft.category} onChange={(event) => setDraftPatch({ category: event.target.value })}>
							{categories.map((category) => (
								<option key={category} value={category}>{category}</option>
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
						{draft.proposals.length ? draft.proposals.map((proposal) => (
							<article key={proposal.id} className="detail-item proposal-item">
								<strong>{proposal.freelancerName}</strong>
								<span>{proposalStatusLabels[proposal.status]}</span>
								<p>{proposal.message}</p>
								<p>{proposal.price} {proposal.currency} · {proposal.estimatedDays} дн.</p>
								{proposal.status === "pending" && !draft.selectedFreelancerId ? (
									<button type="button" className="hm-button" onClick={() => void selectProposal(proposal)}>
										Выбрать исполнителя
									</button>
								) : null}
							</article>
						)) : <p className="detail-note">Пока нет откликов</p>}
					</div>
				) : null}

				{canPropose ? (
					<div className="proposal-form">
						<label className="detail-field">
							<span>Сообщение заказчику</span>
							<textarea value={proposalMessage} onChange={(event) => setProposalMessage(event.target.value)} />
						</label>
						<div className="create-form__row">
							<input value={proposalPrice} onChange={(event) => setProposalPrice(event.target.value)} placeholder="Стоимость" inputMode="numeric" />
							<input value={proposalDays} onChange={(event) => setProposalDays(event.target.value)} placeholder="Срок в днях" inputMode="numeric" />
						</div>
						<button type="button" className="hm-button" onClick={() => void submitProposal()} disabled={saving}>
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
							<button type="button" className="hm-button hm-button--ghost" onClick={() => void withdrawProposal()}>
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
								onChange={(event) => updateBrief(section.key, event.target.value)}
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
						{isOwner ? (
							<textarea
								value={question.answer}
								placeholder="Ответ"
								onChange={(event) =>
									setDraftPatch({
										clarificationQuestions: draft.clarificationQuestions.map((item) =>
											item.id === question.id
												? { ...item, answer: event.target.value }
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
			</section>

			<section className="order-section">
				<h2>Scope</h2>
				{(["included", "excluded", "later"] as ScopeBucket[]).map((bucket) => (
					<div key={bucket} className="scope-line">
						<h3>{scopeBucketLabels[bucket]}</h3>
						{draft.scopeItems
							.filter((item) => item.bucket === bucket)
							.map((item) => (
								<p key={item.id}>
									<strong>{item.title}</strong> — {item.description}
								</p>
							))}
					</div>
				))}
			</section>

			<section className="order-section">
				<h2>Definition of Done</h2>
				{draft.doneCriteria.map((criterion) => (
					<label key={criterion.id} className="detail-check">
						<input
							type="checkbox"
							checked={criterion.checked}
							disabled={!isOwner}
							onChange={() =>
								setDraftPatch({
									doneCriteria: draft.doneCriteria.map((item) =>
										item.id === criterion.id
											? { ...item, checked: !item.checked }
											: item,
									),
								})
							}
						/>
						<span>{criterion.text}</span>
					</label>
				))}
			</section>

			<section className="order-section">
				<h2>Риски</h2>
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
							<p>{draft.approvals.client ? "Подтверждено" : "Ожидает подтверждения"}</p>
							{isOwner ? (
								<button type="button" className="hm-button" onClick={() => void toggleApproval("client")} disabled={saving}>
									{draft.approvals.client ? "Отменить" : "Подтвердить"}
								</button>
							) : null}
						</article>
						<article className="detail-item">
							<strong>{selectedProposal?.freelancerName ?? "Фрилансер"}</strong>
							<p>{draft.approvals.freelancer ? "Подтверждено" : "Ожидает подтверждения"}</p>
							{isSelectedFreelancer ? (
								<button type="button" className="hm-button" onClick={() => void toggleApproval("freelancer")} disabled={saving}>
									{draft.approvals.freelancer ? "Отменить" : "Подтвердить"}
								</button>
							) : (
								<span className="detail-note">Подтверждает выбранный фрилансер</span>
							)}
						</article>
					</div>
				</section>
			) : null}

			{isOwner ? <AiAssistantPanel order={draft} onApply={applyAiResult} /> : null}
		</main>
	);
}
