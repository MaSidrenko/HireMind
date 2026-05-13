import { useState, type FormEvent } from "react";
import {
	useAuth,
	createProjectRequest,
	generateAiBrief,
	type Currency,
	type BudgetType,
	type ProjectOrder,
} from "@/features";

type CreateOrderPageProps = {
	onBack: () => void;
	onCreated: (order: ProjectOrder) => void;
};

export default function CreateOrderPage({
	onBack,
	onCreated,
}: CreateOrderPageProps) {
	const { user } = useAuth();
	const [title, setTitle] = useState("");
	const [companyName, setComapnyName] = useState("");
	const [category, setCategory] = useState("Выберите категорию");
	const [rawDescription, setRawDescription] = useState("");
	const [budgetMin, setBudgetMin] = useState("");
	const [budgetMax, setBudgetMax] = useState("");
	const [currency, setCurrency] = useState<Currency>("RUB");
	const [budgetType, setBudgetType] = useState<BudgetType>("fixed");
	const [skills, setSkills] = useState("");
	const [aiSummary, setAiSummary] = useState(
		"AI поможет найти недостающие вопросы до публикации",
	);
	const [error, setError] = useState("");
	const [loadingAi, setLoadingAi] = useState(false);

	const runAi = async () => {
		setLoadingAi(true);
		const result = await generateAiBrief({
			title,
			category,
			rawDescription,
		});
		setAiSummary(result.summary);
		setLoadingAi(false);
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (title.trim().length < 5 || rawDescription.trim().length < 30) {
			setError("Заполните название и описание задачи подробнее.");
			return;
		}

		const order = await createProjectRequest({
			hirerId: user?.id ?? 0,
			hirerName: user?.fullName ?? "Заказчик",
			title,
			companyName,
			category,
			rawDescription,
			budgetMin: Number(budgetMin) || 0,
			budgetMax: Number(budgetMax) || Number(budgetMin) || 0,
			currency,
			budgetType,
			skills: skills
				.split(",")
				.map((skills) => skills.trim())
				.filter(Boolean),
		});
		onCreated(order);
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
					<input
						value={companyName}
						onChange={(event) => setComapnyName(event.target.value)}
						placeholder="Компания"
					/>
					<select
						value={category}
						onChange={(event) => setCategory(event.target.value)}
					>
						<option>Разработка</option>
						<option>Дизайн</option>
						<option>Маркетинг</option>
						<option>Контент</option>
					</select>
					<textarea
						value={rawDescription}
						onChange={(event) =>
							setRawDescription(event.target.value)
						}
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
								setBudgetMin(event.target.value)
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
					<input
						value={skills}
						onChange={(event) => setSkills(event.target.value)}
						placeholder="Навыки через запятую"
					/>
					{error ? <p className="form-error">{error}</p> : null}
					<button type="submit" className="hm-button">
						Сформировать заказ
					</button>
				</section>
				<aside className="hm-panel ai-panel">
					<span className="hm-kicker">AI</span>
					<h2>Проверка запроса</h2>
					<p>{aiSummary}</p>
					<button
						type="button"
						className="hm-button hm-button--ghost"
						onClick={runAi}
						disabled={loadingAi}
					>
						{loadingAi ? "Анализ..." : "Проанализировать"}
					</button>
				</aside>
			</form>
		</main>
	);
}
