import type { Currency, ProjectOrder } from "./types";

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
	RUB: new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }),
	USD: new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
	EUR: new Intl.NumberFormat("ru-RU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

export function formatBudget(order: Pick<ProjectOrder, "budgetMin" | "budgetMax" | "currency" | "budgetType">) {
	const range = `${currencyFormatters[order.currency].format(order.budgetMin)} - ${currencyFormatters[order.currency].format(order.budgetMax)}`;
	return order.budgetType === "hourly" ? `${range} / час` : range;
}

export function formatDate(date: string | null) {
	return date ? dateFormatter.format(new Date(date)) : "Не опубликован";
}
