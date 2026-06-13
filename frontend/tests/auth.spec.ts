import { expect, test } from "@playwright/test";
import {
	mockClientUser,
	setupMockApi,
} from "./helpers/mockApi";

test("sign in and logout flow works with mocked auth api", async ({ page }) => {
	const { requestLog, getCurrentUser } = await setupMockApi(page, {
		signInUser: mockClientUser,
	});

	await page.goto("/sign-in");

	await page.getByPlaceholder("Введите ваш email").fill("client@test.com");
	await page.getByPlaceholder("Введите ваш пароль").fill("Password123!");
	await page.getByRole("button", { name: "Войти" }).click();

	await expect(page).toHaveURL(/\/profile$/);
	await expect(
		page.getByRole("heading", { name: mockClientUser.fullName }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Выйти из аккаунта" }),
	).toBeVisible();

	expect(getCurrentUser()?.email).toBe(mockClientUser.email);
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/sign-in" &&
				(entry.body as { email?: string })?.email === "client@test.com",
		),
	).toBe(true);

	await page.getByRole("button", { name: "Выйти из аккаунта" }).click();

	await expect(page).toHaveURL(/\/sign-in$/);
	await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
	expect(getCurrentUser()).toBeNull();
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/logout",
		),
	).toBe(true);
});

test("sign up moves user to email confirmation and verifies code", async ({
	page,
}) => {
	const { requestLog } = await setupMockApi(page);

	await page.goto("/sign-up");

	await page.getByPlaceholder("Введите вашу фамилию").fill("Иванов");
	await page.getByPlaceholder("Введите ваше имя").fill("Иван");
	await page.getByPlaceholder("Введите ваше отчество").fill("Иванович");
	await page.getByPlaceholder("Введите ваш email").fill("ivan@test.com");
	await page.getByPlaceholder("Введите ваш пароль").fill("Password123!");
	await page.getByPlaceholder("Подтвердите ваш пароль").fill("Password123!");
	await page.getByRole("button", { name: "Выберите роль" }).click();
	await page.locator(".dropdown-item").filter({ hasText: "Заказчик" }).click();
	await page
		.getByPlaceholder("Введите название вашей компании")
		.fill("Test Company");
	await page.getByPlaceholder("Введите ваш Telegram ID").fill("@ivan");
	await page.getByPlaceholder("+7 999 123 45 67").fill("+79990000003");
	await page.getByRole("button", { name: "Зарегистрироваться" }).click();

	await expect(page).toHaveURL(/\/email-code$/);
	await expect(
		page.getByRole("heading", { name: "Подтвердите email" }),
	).toBeVisible();

	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/sign-up" &&
				(entry.body as { email?: string })?.email === "ivan@test.com",
		),
	).toBe(true);

	await page.getByPlaceholder("Введите код подтверждения").fill("123456");
	await page.getByRole("button", { name: "Подтвердить" }).click();

	await expect(page).toHaveURL(/\/sign-in$/);
	await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/email-verify" &&
				(entry.body as { email?: string; code?: string })?.email ===
					"ivan@test.com" &&
				(entry.body as { email?: string; code?: string })?.code ===
					"123456",
		),
	).toBe(true);

	await expect
		.poll(() => page.evaluate(() => sessionStorage.getItem("emailVerifyAllowed")))
		.toBeNull();
});
