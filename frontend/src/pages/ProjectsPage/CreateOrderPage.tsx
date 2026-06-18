import { useState, type FormEvent } from "react";
import {
	useAuth,
	createProjectRequest,
	generateAiBrief,
	type AiBriefResult,
	type BudgetType,
	type Currency,
	type ProjectOrder,
} from "@/features";
import { ApiError } from "@/shared";
import { projectSkillOptions } from "@/shared/skillOptions";
import SkillsAutocomplete from "@/widgets/SkillsAutoComplete/SkillsAutoComplete";

type CreateOrderPageProps = {
	onBack: () => void;
	onCreated: (order: ProjectOrder) => void;
};

const categoryPlaceholder = "Выберите категорию";
const categories = [
	"Разработка",
	"Мобильная разработка",
	"Дизайн",
	"Маркетинг",
	"Контент",
];

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof ApiError) return error.message;
	return fallback;
}

function parsePositiveNumber(value: string) {
	const normalized = Number(value);
	return Number.isFinite(normalized) ? normalized : 0;
}

export default function CreateOrderPage({
	onBack,
	onCreated,
}: CreateOrderPageProps) {
	const { user } = useAuth();
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState(categoryPlaceholder);
	const [rawDescription, setRawDescription] = useState("");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [currency, setCurrency] = useState<Currency>("RUB");
	const [budgetType, setBudgetType] = useState<BudgetType>("fixed");
	const [skills, setSkills] = useState<string[]>([]);
	const [aiSummary, setAiSummary] = useState(
		"AI поможет найти недостающие вопросы до публикации",
	);
	const [aiResult, setAiResult] = useState<AiBriefResult | null>(null);
	const [aiApplied, setAiApplied] = useState(false);
	const [error, setError] = useState("");
	const [loadingAi, setLoadingAi] = useState(false);
	const companyName =
		user && "companyName" in user ? user.companyName?.trim() ?? "" : "";

	const validateDraft = () => {
		if (title.trim().length < 5 || rawDescription.trim().length < 30) {
			return "Заполните название и описание задачи подробнее.";
		}

		if (category === categoryPlaceholder) {
			return "Выберите категорию заказа";
		}

		const min = parsePositiveNumber(budgetMin);
		const max = parsePositiveNumber(budgetMax) || min;

		if (min < 0 || max < 0) {
			return "Бюджет не может быть отрицательным";
		}

		if (max < min) {
			return "Цена до не может быть меньше цены от";
		}

		if (!skills.length) {
			return "Добавьте хотя бы один навык";
		}

		return "";
	};

	const validateAiInput = () => {
		if (title.trim().length < 5 || rawDescription.trim().length < 30) {
			return "Добавьте название и подробное описание перед AI-анализом";
		}

		if (category === categoryPlaceholder) {
			return "Выберите категорию перед AI-анализом";
		}

		return "";
	};

	const runAi = async () => {
		const validationError = validateAiInput();
		if (validationError) {
			setError(validationError);
			return;
		}

		setLoadingAi(true);
		setError("");
		setAiApplied(false);

		try {
			const result = await generateAiBrief({
				title,
				category,
				rawDescription,
			});
			setAiResult(result);
			setAiSummary(result.summary);
		} catch (err) {
			setError(getErrorMessage(err, "Не удалось получить AI-подсказку"));
		} finally {
			setLoadingAi(false);
		}
	};

	const applyAiResult = () => {
		if (!aiResult) return;
		setAiApplied(true);
		setError("");
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const validationError = validateDraft();
		if (validationError) {
			setError(validationError);
			return;
		}

		const min = parsePositiveNumber(budgetMin);
		const max = parsePositiveNumber(budgetMax) || min;
		const appliedAi = aiApplied ? aiResult : null;

		setError("");
		try {
			const order = await createProjectRequest({
				hirerId: user?.id ?? 0,
				hirerName: user?.fullName ?? "Заказчик",
				title: title.trim(),
				companyName,
				category,
				rawDescription: rawDescription.trim(),
				minPrice: min,
				maxPrice: max,
				currency,
				payment: budgetType,
				skills,
				aiSummary: appliedAi?.summary,
				briefSections: appliedAi?.briefSections,
				clarificationQuestions: appliedAi?.questions,
				scopeItems: appliedAi?.scopeItems,
				doneCriteria: appliedAi?.doneCriteria,
				risks: appliedAi?.risks,
			});
			onCreated(order);
		} catch (err) {
			setError(getErrorMessage(err, "Не удалось создать заказ"));
		}
	};

	return (
		<main className="orders-page">
			<div className="page-heading">
				<button
					type="button"
					className="hm-link-button"
					onClick={onBack}
				>
					Назад
				</button>
				<h1>Создать заказ</h1>
			</div>
			<form className="create-layout" onSubmit={submit}>
				<section className="hm-panel create-form">
					<input
						value={title}
						onChange={(event) => setTitle(event.target.value)}
						placeholder="Название заказа"
					/>
					<div className="detail-item">
						<span>Компания из профиля</span>
						<strong>{companyName || "Не указана в профиле"}</strong>
					</div>
					<select
						value={category}
						onChange={(event) => {
							setCategory(event.target.value);
							setAiApplied(false);
						}}
					>
						<option value={categoryPlaceholder}>
							{categoryPlaceholder}
						</option>
						{categories.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
					<textarea
						value={rawDescription}
						onChange={(event) => {
							setRawDescription(event.target.value);
							setAiApplied(false);
						}}
						placeholder="Сырой запрос заказчика"
					/>
					<div className="create-form__row">
						<input
							value={budgetMin}
							onChange={(event) =>
								setBudgetMin(event.target.value)
							}
							placeholder="Цена от"
							inputMode="numeric"
						/>
						<input
							value={budgetMax}
							onChange={(event) =>
								setBudgetMax(event.target.value)
							}
							placeholder="Цена до"
							inputMode="numeric"
						/>
						<select
							value={currency}
							onChange={(event) =>
								setCurrency(event.target.value as Currency)
							}
						>
							<option value="RUB">RUB</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
						</select>
						<select
							value={budgetType}
							onChange={(event) =>
								setBudgetType(event.target.value as BudgetType)
							}
						>
							<option value="fixed">Фикс</option>
							<option value="hourly">Почасово</option>
						</select>
					</div>
					<div className="detail-field">
						<span>Навыки проекта</span>
						<SkillsAutocomplete
							options={[...projectSkillOptions]}
							maxSelected={8}
							value={skills}
							onChange={setSkills}
							hideHeader
							placeholder="Добавьте стек или специализацию"
							emptyText="Подходящий навык не найден"
						/>
					</div>
					{error ? <p className="form-error">{error}</p> : null}
					<button type="submit" className="hm-button">
						Сформировать заказ
					</button>
				</section>
				<aside className="hm-panel ai-panel">
					<span className="hm-kicker">AI</span>
					<h2>Проверка запроса</h2>
					<p>{aiSummary}</p>
					{aiApplied ? (
						<p className="detail-note">
							AI-бриф будет добавлен в заказ
						</p>
					) : null}
					<button
						type="button"
						className="hm-button hm-button--ghost"
						onClick={runAi}
						disabled={loadingAi}
					>
						{loadingAi ? "Анализ..." : "Проанализировать"}
					</button>
					{aiResult ? (
						<button
							type="button"
							className="hm-button hm-button--ghost"
							onClick={applyAiResult}
							disabled={aiApplied}
						>
							{aiApplied
								? "AI-бриф применен"
								: "Применить AI-бриф"}
						</button>
					) : null}
				</aside>
			</form>
		</main>
	);
}
