const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const USE_MOCK_DATA = false;

type SortBy = "default" | "price-asc" | "price-desc" | "title-asc";

type GetProjectsParams = {
	name?: string;
	category?: string;
	page?: number;
	limit?: number;
	priceFrom?: string;
	priceTo?: string;
	sortBy?: SortBy;
};

type Project = {
	id: string;
	title: string;
	category: string;
	icon: string;
	description: string;
	company: string;
	price: string;
};

type GetProjectsResponse = {
	projects: Project[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

// export const mockProjects: Project[] = [
// 	{
// 		id: "1",
// 		title: "Лендинг для онлайн-школы",
// 		category: "Веб-разработка",
// 		icon: "💻",
// 		description:
// 			"Создать адаптивный лендинг с формой заявки, блоком преимуществ и отзывами.",
// 		company: "ooo",
// 		price: "от 25 000 ₽",
// 	},
// 	{
// 		id: "2",
// 		title: "Интернет-магазин одежды",
// 		category: "Веб-разработка",
// 		icon: "💻",
// 		description:
// 			"Разработать каталог товаров, корзину, карточку товара и оформление заказа.",
// 		company: "ooo",
// 		price: "от 60 000 ₽",
// 	},
// 	{
// 		id: "3",
// 		title: "Личный кабинет пользователя",
// 		category: "Веб-разработка",
// 		icon: "💻",
// 		description:
// 			"Сделать страницу профиля, историю заказов и настройки аккаунта.",
// 		company: "ooo",
// 		price: "от 40 000 ₽",
// 	},
// 	{
// 		id: "4",
// 		title: "Дизайн мобильного приложения",
// 		category: "Дизайн",
// 		icon: "🎨",
// 		description: "Подготовить UI/UX-дизайн экранов приложения в Figma.",
// 		company: "ooo",
// 		price: "от 35 000 ₽",
// 	},
// 	{
// 		id: "5",
// 		title: "Редизайн сайта компании",
// 		category: "Дизайн",
// 		icon: "🎨",
// 		description:
// 			"Обновить визуальный стиль сайта, улучшить навигацию и структуру блоков.",
// 		company: "ooo",
// 		price: "от 45 000 ₽",
// 	},
// 	{
// 		id: "6",
// 		title: "Тексты для лендинга",
// 		category: "Копирайтинг",
// 		icon: "✍️",
// 		description:
// 			"Написать продающие тексты для главного экрана, преимуществ и CTA-блоков.",
// 		company: "ooo",
// 		price: "от 8 000 ₽",
// 	},
// 	{
// 		id: "7",
// 		title: "Статьи для блога",
// 		category: "Копирайтинг",
// 		icon: "✍️",
// 		description:
// 			"Подготовить SEO-статьи на темы бизнеса, технологий и продвижения.",
// 		company: "ooo",
// 		price: "от 3 000 ₽ за статью",
// 	},
// 	{
// 		id: "8",
// 		title: "Описание товаров",
// 		category: "Копирайтинг",
// 		icon: "✍️",
// 		description:
// 			"Составить короткие и понятные описания для карточек товаров.",
// 		company: "ooo",
// 		price: "от 500 ₽ за описание",
// 	},
// 	{
// 		id: "9",
// 		title: "Приложение для записи на услуги",
// 		category: "Мобильная разработка",
// 		icon: "📱",
// 		description:
// 			"Разработать мобильное приложение с выбором услуги, даты и времени записи.",
// 		company: "ooo",
// 		price: "от 90 000 ₽",
// 	},
// 	{
// 		id: "10",
// 		title: "React Native приложение для доставки",
// 		category: "Мобильная разработка",
// 		icon: "📱",
// 		description:
// 			"Создать приложение с каталогом, корзиной и отслеживанием заказа.",
// 		company: "ooo",
// 		price: "от 120 000 ₽",
// 	},
// 	{
// 		id: "11",
// 		title: "Настройка рекламной кампании",
// 		category: "Маркетинг",
// 		icon: "📈",
// 		description:
// 			"Запустить рекламу, подобрать аудитории, настроить цели и аналитику.",
// 		company: "ooo",
// 		price: "от 20 000 ₽",
// 	},
// 	{
// 		id: "12",
// 		title: "SMM-продвижение бренда",
// 		category: "Маркетинг",
// 		icon: "📈",
// 		description:
// 			"Разработать контент-план, оформить посты и подготовить стратегию продвижения.",
// 		company: "ooo",
// 		price: "от 30 000 ₽",
// 	},
// 	{
// 		id: "13",
// 		title: "SEO-аудит сайта",
// 		category: "Маркетинг",
// 		icon: "📈",
// 		description:
// 			"Проверить сайт на технические ошибки, структуру, скорость и SEO-проблемы.",
// 		company: "ooo",
// 		price: "от 15 000 ₽",
// 	},
// ];

// function getPriceNumber(price: string) {
// 	const number = price.replace(/\D/g, "");
// 	return number ? Number(number) : 0;
// }

// function sortProjects(projects: Project[], sortBy: SortBy) {
// 	const sortedProjects = [...projects];

// 	if (sortBy === "price-asc") {
// 		return sortedProjects.sort(
// 			(a, b) => getPriceNumber(a.price) - getPriceNumber(b.price),
// 		);
// 	}

// 	if (sortBy === "price-desc") {
// 		return sortedProjects.sort(
// 			(a, b) => getPriceNumber(b.price) - getPriceNumber(a.price),
// 		);
// 	}

// 	if (sortBy === "title-asc") {
// 		return sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
// 	}

// 	return sortedProjects;
// }

// async function getProjectsFromMock({
// 	name = "",
// 	category = "Все проекты",
// 	page = 1,
// 	limit = 20,
// 	priceFrom = "",
// 	priceTo = "",
// 	sortBy = "default",
// }: GetProjectsParams): Promise<GetProjectsResponse> {
// 	let filteredProjects = mockProjects;

// 	const normalizedName = name.trim().toLowerCase();

// 	if (normalizedName) {
// 		filteredProjects = filteredProjects.filter((project) =>
// 			project.title.toLowerCase().includes(normalizedName),
// 		);
// 	}

// 	if (category !== "Все проекты") {
// 		filteredProjects = filteredProjects.filter(
// 			(project) => project.category === category,
// 		);
// 	}

// 	if (priceFrom) {
// 		filteredProjects = filteredProjects.filter(
// 			(project) => getPriceNumber(project.price) >= Number(priceFrom),
// 		);
// 	}

// 	if (priceTo) {
// 		filteredProjects = filteredProjects.filter(
// 			(project) => getPriceNumber(project.price) <= Number(priceTo),
// 		);
// 	}

// 	const sortedProjects = sortProjects(filteredProjects, sortBy);

// 	const total = sortedProjects.length;
// 	const totalPages = Math.max(Math.ceil(total / limit), 1);

// 	const safePage = Math.min(Math.max(page, 1), totalPages);

// 	const startIndex = (safePage - 1) * limit;
// 	const endIndex = startIndex + limit;

// 	const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

// 	return new Promise((resolve) => {
// 		setTimeout(() => {
// 			resolve({
// 				projects: paginatedProjects,
// 				total,
// 				page: safePage,
// 				limit,
// 				totalPages,
// 			});
// 		}, 300);
// 	});
// }

async function getProjectsFromBackend({
	name = "",
	category = "Все проекты",
	page = 1,
	limit = 20,
	priceFrom = "",
	priceTo = "",
	sortBy = "default",
}: GetProjectsParams): Promise<GetProjectsResponse> {
	const params = new URLSearchParams();

	params.append("page", String(page));
	params.append("limit", String(limit));

	if (name.trim()) {
		params.append("name", name.trim());
	}

	if (category && category !== "Все проекты") {
		params.append("category", category);
	}

	if (priceFrom) {
		params.append("priceFrom", priceFrom);
	}

	if (priceTo) {
		params.append("priceTo", priceTo);
	}

	if (sortBy !== "default") {
		params.append("sortBy", sortBy);
	}

	const response = await fetch(
		`${API_BASE_URL}/api/projects?${params.toString()}`,
		{
			method: "GET",
			credentials: "include",
		},
	);

	if (!response.ok) {
		throw new Error("Failed to fetch projects");
	}

	return response.json();
}

export async function getProjects(
	params: GetProjectsParams,
): Promise<GetProjectsResponse> {
	if (USE_MOCK_DATA) {
		// return getProjectsFromMock(params);
	}

	return getProjectsFromBackend(params);
}