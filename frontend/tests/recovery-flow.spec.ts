import { expect, test } from "@playwright/test";
import { setupMockApi } from "./helpers/mockApi";

test("forgot password and reset flow returns the user to login", async ({
	page,
}) => {
	const { requestLog } = await setupMockApi(page);

	await page.goto("/recovery-password");

	await page.getByLabel("Email").fill("test@example.com");
	await page.getByRole("button", { name: "Отправить код" }).click();

	await expect(
		page.getByText("Если email привязан к аккаунту, код отправлен на почту."),
	).toBeVisible();
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/recovery-password" &&
				(entry.body as { email?: string })?.email === "test@example.com",
		),
	).toBe(true);

	await page.getByRole("link", { name: "У меня уже есть код" }).click();

	await expect(page).toHaveURL(/\/recovery-password\/confirm$/);

	await page.getByPlaceholder("Введите ваш email").fill("test@example.com");
	await page.getByPlaceholder("Введите код из письма").fill("123456");
	await page.getByPlaceholder("Введите новый пароль").fill("Password123!");
	await page
		.getByPlaceholder("Повторите новый пароль")
		.fill("Password123!");
	await page.getByRole("button", { name: "Сохранить новый пароль" }).click();

	await expect(page.getByText("Пароль успешно обновлён")).toBeVisible();
	expect(
		requestLog.some(
			(entry) =>
				entry.method === "POST" &&
				entry.pathname === "/api/v1/auth/recovery-password/confirm" &&
				(entry.body as {
					email?: string;
					code?: string;
					newPassword?: string;
				})?.email === "test@example.com" &&
				(entry.body as {
					email?: string;
					code?: string;
					newPassword?: string;
				})?.code === "123456",
		),
	).toBe(true);

	await page.getByRole("link", { name: "Вернуться ко входу" }).click();

	await expect(page).toHaveURL(/\/sign-in$/);
	await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});
