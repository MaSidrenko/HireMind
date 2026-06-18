import { expect, test, type Page } from "@playwright/test";
import {
	mockClientUser,
	mockFreelancerUser,
	setupMockApi,
} from "./helpers/mockApi";

async function signInAs(page: Page, email: string) {
	await page.goto("/sign-in");

	await page.getByPlaceholder("Введите ваш email").fill(email);
	await page.getByPlaceholder("Введите ваш пароль").fill("Password123!");
	await page.getByRole("button", { name: "Войти" }).click();

	await expect(page).toHaveURL(/\/profile$/);
}

async function logout(page: Page) {
	await page.goto("/profile");
	await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
	await expect(page).toHaveURL(/\/sign-in$/);
}

test("order goes through full client and freelancer lifecycle", async ({
	page,
}) => {
	const { requestLog } = await setupMockApi(page, {
		initialUser: mockClientUser,
	});

	await page.goto("/projects/new");

	await page.getByPlaceholder("Название заказа").fill("Разработка лендинга для AI-агентства");
	await page.locator("select").first().selectOption("Разработка");
	await page
		.getByPlaceholder("Сырой запрос заказчика")
		.fill(
			"Нужен современный лендинг с формой заявки, блоком кейсов и адаптивной версией для запуска рекламной кампании.",
		);
	await page.getByPlaceholder("Цена от").fill("50000");
	await page.getByPlaceholder("Цена до").fill("80000");
	await page
		.getByPlaceholder("Добавьте стек или специализацию")
		.fill("React");
	await page.locator('li[role="option"]').filter({ hasText: /^React$/ }).click();
	await page
		.getByPlaceholder("Добавьте стек или специализацию")
		.fill("TypeScript");
	await page
		.locator('li[role="option"]')
		.filter({ hasText: /^TypeScript$/ })
		.click();
	await page.getByRole("button", { name: "Сформировать заказ" }).click();

	await expect(page).toHaveURL(/\/projects\/\d+$/);
	await expect(page.locator(".detail-title-input")).toHaveValue(
		"Разработка лендинга для AI-агентства",
	);

	const orderId = Number(page.url().match(/\/projects\/(\d+)$/)?.[1]);
	expect(orderId).toBeGreaterThan(0);

	await page.getByRole("button", { name: "Опубликовать" }).click();
	await expect(
		page.getByRole("button", { name: "Поставить на паузу" }),
	).toBeVisible();

	await logout(page);
	await signInAs(page, mockFreelancerUser.email);

	await page.goto(`/projects/${orderId}`);
	await page.getByRole("button", { name: "Откликнуться" }).click();
	await expect(page.getByText("Отклик отправлен")).toBeVisible();

	await logout(page);
	await signInAs(page, mockClientUser.email);

	await page.goto(`/projects/${orderId}`);
	await page.getByRole("button", { name: "Выбрать исполнителя" }).click();
	await expect(page.getByText("Исполнитель выбран")).toBeVisible();

	await page
		.locator("section")
		.filter({ has: page.getByRole("heading", { name: "Согласование" }) })
		.getByRole("button", { name: "Подтвердить" })
		.click();
	await expect(page.getByText("Подтверждение обновлено")).toBeVisible();

	await logout(page);
	await signInAs(page, mockFreelancerUser.email);

	await page.goto(`/projects/${orderId}`);
	await page
		.locator("section")
		.filter({ has: page.getByRole("heading", { name: "Согласование" }) })
		.getByRole("button", { name: "Подтвердить" })
		.click();
	await expect(page.getByText("Заказ перешёл в работу")).toBeVisible();

	await page.getByRole("button", { name: "Отправить на подтверждение" }).click();
	await expect(page.getByText("Готовность отправлена заказчику")).toBeVisible();

	await logout(page);
	await signInAs(page, mockClientUser.email);

	await page.goto(`/projects/${orderId}`);
	await page.getByRole("button", { name: "Подтвердить завершение" }).click();
	await expect(
		page.getByRole("button", { name: "Подтвердить оценку" }),
	).toBeVisible();

	await page.getByRole("button", { name: "Подтвердить оценку" }).click();
	await expect(page.getByText("Оценка сохранена")).toBeVisible();

	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/order/create",
		),
	).toBe(true);
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "PUT" &&
				entry.pathname === "/api/v1/order/proposal/create",
		),
	).toBe(true);
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "PUT" &&
				entry.pathname === `/api/v1/order/${orderId}/completion/client/accept`,
		),
	).toBe(true);
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "PUT" &&
				entry.pathname === `/api/v1/order/${orderId}/rating`,
		),
	).toBe(true);
});
