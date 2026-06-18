import { MAIN_API, apiRequest } from "@/shared";

const homeCategoryToBackend = {
	"Веб-разработка": "Development",
	"Дизайн": "Design",
	"Копирайтинг": "Content",
	"Мобильная разработка": "MobileDevelopment",
	"Маркетинг": "Marketing",
} as const;

export type HomeCategoryName = keyof typeof homeCategoryToBackend;

type BackendCategory = (typeof homeCategoryToBackend)[HomeCategoryName];

export async function getUserCount() {
	return apiRequest<number>(`${MAIN_API}/user-count`);
}

export async function getCategoryProjectCount(category: HomeCategoryName) {
	const backendCategory = homeCategoryToBackend[category];

	return apiRequest<number>(
		`${MAIN_API}/project-type-count?category=${encodeURIComponent(
			backendCategory,
		)}`,
	);
}

export async function getCategoryProjectCounts(
	categories: readonly HomeCategoryName[],
) {
	const uniqueBackendCategories = Array.from(
		new Set(categories.map((category) => homeCategoryToBackend[category])),
	);

	const settledCounts = await Promise.allSettled(
		uniqueBackendCategories.map((category) =>
			apiRequest<number>(
				`${MAIN_API}/project-type-count?category=${encodeURIComponent(
					category,
				)}`,
			),
		),
	);

	const countsByBackend = uniqueBackendCategories.reduce(
		(acc, category, index) => {
			const result = settledCounts[index];
			acc[category] = result?.status === "fulfilled" ? result.value : 0;
			return acc;
		},
		{} as Record<BackendCategory, number>,
	);

	return Object.fromEntries(
		categories.map((category) => [
			category,
			countsByBackend[homeCategoryToBackend[category]] ?? 0,
		]),
	) as Record<HomeCategoryName, number>;
}
