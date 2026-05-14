import { expect, test } from "@playwright/test";

test("home page opens and category link applies orders filter", async ({
	page,
}) => {
	await page.goto("/");

	await expect(
		page.getByRole("heading", { name: /HireMind: ИИ формирует ТЗ/i }),
	).toBeVisible();

	await page.getByRole("link", { name: /Дизайн/i }).click();

	await expect(page).toHaveURL(/\/projects$/);
	await expect(page.getByRole("heading", { name: "Заказы" })).toBeVisible();
	await expect(page.locator("select").nth(1)).toHaveValue("Дизайн");
});

test("unknown route renders 404 page", async ({ page }) => {
	await page.goto("/unknown-route");

	await expect(
		page.getByRole("heading", { name: "Страница не найдена" }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "На главную" }),
	).toHaveAttribute("href", "/");
});

test("mobile navigation opens menu", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");

	await page.getByRole("button", { name: "Открыть меню" }).click();

	await expect(page.getByRole("link", { name: "Главная" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Вход" })).toBeVisible();
});

test("sign in route opens", async ({ page }) => {
	await page.goto("/sign-in");

	await expect(
		page.getByRole("heading", { name: /вход|sign in|login/i }),
	).toBeVisible();
});

test("sign up route opens", async ({ page }) => {
	await page.goto('/sign-up');

	await expect(
		page.getByRole("heading", {name: /Регистрация/i})
	).toBeVisible();
})

test("open page profile", async ({ page }) => {
	await page.goto('/projects');

	await expect(
		page.getByPlaceholder("Название заказа")
	).toBeVisible();
})