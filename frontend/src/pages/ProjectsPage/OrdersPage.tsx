import { useMemo, useState } from "react";
import { useAuth, type OrderStatus, type ProjectOrder } from "@/features";
import { OrderCard } from "./components/OrderCard";
import { PageState } from "@/widgets";

type SortMode = "none" | "priceAsc" | "priceDesc" | "newest";

const defaultCategories = [
	"Веб-разработка",
	"Дизайн",
	"Копирайтинг",
	"Мобильная разработка",
	"Маркетинг",
];

type OrdersPageProps = {
	orders: ProjectOrder[];
	loading: boolean;
	error?: string;
	initialCategory?: string;
	onCreate: () => void;
	onOpen: (id: number) => void;
};

export default function OrdersPage({
	orders,
	loading,
	error,
	initialCategory = "all",
	onCreate,
	onOpen,
}: OrdersPageProps) {
	const { user } = useAuth();
	const normalizedRole = String(user?.role ?? "").toLowerCase();
	const [status, setStatus] = useState<"all" | OrderStatus>("all");
	const [category, setCategory] = useState(initialCategory);
	const [query, setQuery] = useState("");
	const [priceFrom, setPriceFrom] = useState("");
	const [priceTo, setPriceTo] = useState("");
	const [sort, setSort] = useState<SortMode>("none");
	const canCreate = normalizedRole === "client" || normalizedRole === "admin";

	const categoryOptions = useMemo(() => {
		return Array.from(
			new Set([
				...defaultCategories,
				...orders.map((order) => order.category).filter(Boolean),
			]),
		);
	}, [orders]);

	const filteredOrders = useMemo(() => {
		const from = Number(priceFrom) || 0;
		const to = Number(priceTo) || Infinity;
		const normalizedQuery = query.trim().toLowerCase();
		const result = orders.filter((order) => {
			const matchesStatus = status === "all" || order.status === status;
			const matchesCategory = category === "all" || order.category === category;
			const matchesQuery = !normalizedQuery || order.title.toLowerCase().includes(normalizedQuery);
			return matchesStatus && matchesCategory && matchesQuery && order.budgetMax >= from && order.budgetMin <= to;
		});

		return [...result].sort((a, b) => {
			if (sort === "priceAsc") return a.budgetMin - b.budgetMin;
			if (sort === "priceDesc") return b.budgetMax - a.budgetMax;
			if (sort === "newest") return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
			return 0;
		});
	}, [category, orders, priceFrom, priceTo, query, sort, status]);

	const reset = () => {
		setStatus("all");
		setCategory("all");
		setQuery("");
		setPriceFrom("");
		setPriceTo("");
		setSort("none");
	};

	return (
		<main className="orders-page orders-page--flat">
			<h1 className="orders-title">Заказы</h1>
			<section className="orders-filterbar">
				<select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)}>
					<option value="all">Все проекты</option>
					<option value="Draft">Черновики</option>
					<option value="Published">Опубликованные</option>
					<option value="Paused">На паузе</option>
					<option value="In_Progress">В работе</option>
					<option value="Completed">Завершённые</option>
					<option value="Archived">Архив</option>
				</select>
				<select value={category} onChange={(event) => setCategory(event.target.value)}>
					<option value="all">Все категории</option>
					{categoryOptions.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
				<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название заказа" />
				<input value={priceFrom} onChange={(event) => setPriceFrom(event.target.value)} placeholder="Цена от" inputMode="numeric" />
				<input value={priceTo} onChange={(event) => setPriceTo(event.target.value)} placeholder="Цена до" inputMode="numeric" />
				<select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
					<option value="none">Без сортировки</option>
					<option value="priceAsc">Цена по возрастанию</option>
					<option value="priceDesc">Цена по убыванию</option>
					<option value="newest">Сначала новые</option>
				</select>
				<button type="button" className="hm-button hm-button--ghost" onClick={reset}>Сбросить</button>
				{canCreate ? (
					<button type="button" className="hm-button hm-button--ghost orders-create-button" onClick={onCreate}>
						Создать заказ
					</button>
				) : null}
			</section>

			{loading ? (
				<PageState
					variant="loading"
					title="Загружаем заказы"
					text="Получаем список проектов с сервера."
				/>
			) : null}
			{!loading && error ? (
				<PageState
					variant="error"
					title="Не удалось загрузить заказы"
					text={
						error && error !== "Не удалось загрузить заказы"
							? error
							: "Проверьте backend или попробуйте обновить страницу."
					}
				/>
			) : null}
			{!loading && !error && filteredOrders.length === 0 ? (
				<PageState
					variant="empty"
					title={orders.length ? "Заказы не найдены" : "Пока нет заказов"}
					text={
						orders.length
							? "Попробуйте изменить фильтры или вернуться к списку позже."
							: "Создайте первый заказ, чтобы AI помог превратить идею в понятное ТЗ."
					}
					action={canCreate ? "Создать заказ" : undefined}
					onAction={canCreate ? onCreate : undefined}
				/>
			) : null}
			{!loading && !error ? (
				<div className="orders-list">
					{filteredOrders.map((order) => (
						<OrderCard key={order.id} order={order} onOpen={onOpen} />
					))}
				</div>
			) : null}
		</main>
	);
}
