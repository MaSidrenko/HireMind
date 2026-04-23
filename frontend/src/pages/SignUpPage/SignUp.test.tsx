import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignUp from "./SignUp";

vi.mock("@/widgets/contextStripMenu/contextStripMenu", () => ({
	default: ({
		title,
		items,
		onSelect,
	}: {
		title: string;
		items: string[];
		onSelect: (itme: string) => void;
	}) => (
		<div data-testid="context-strip-menu">
			<div>{title}</div>

			{items.map((item) => (
				<button key={item} type="button" onClick={() => onSelect(item)}>
					{item}
				</button>
			))}
		</div>
	),
}));

vi.mock("@/widgets/SkillsAutoComplete/SkillsAutoComplete", () => ({
	default: () => (
		<div data-testid="skills-autocomplete">SkillsAutoComplete</div>
	),
}));

afterEach(() => {
	vi.resetAllMocks();
});

describe("SignUp", () => {
	it("Render basic forms", () => {
		render(<SignUp />);

		expect(
			screen.getByRole("heading", { name: "Регистрация" }),
		).toBeInTheDocument();

		expect(
			screen.getByText("Создайте свой аккаунт, чтобы начать"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Введите вашу фамилию"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите ваше имя"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите ваше отчество"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Введите ваш email"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Введите ваш пароль"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("Подтвердите ваш пароль"),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText("Введите ваш Telegram ID"),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("+7 999 123 45 67"),
		).toBeInTheDocument();

		expect(
			screen.getByDisplayValue("Зарегистрироваться"),
		).toBeInTheDocument();

		expect(screen.getByText("Выберите роль")).toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText("Введите название вашей компании"),
		).not.toBeInTheDocument();
	});

	it("Show company field when user role is 'Заказчик'", async () => {
		const user = userEvent.setup();

		render(<SignUp />);

		await user.click(screen.getByRole("button", { name: "Заказчик" }));
		expect(
			screen.getByPlaceholderText("Введите название вашей компании"),
		).toBeInTheDocument();
	});

	it("Hide company field when user role is 'Фрилансер'", async () => {
		const user = userEvent.setup();
		render(<SignUp />);

		await user.click(screen.getByRole("button", { name: "Заказчик" }));
		expect(
			screen.getByPlaceholderText("Введите название вашей компании"),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Фрилансер" }));

		expect(
			screen.queryByPlaceholderText("Введите название вашей компании"),
		).not.toBeInTheDocument();
	});

	it("call submit form", async () => {
		const user = userEvent.setup();
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		render(<SignUp />);

		await user.type(
			screen.getByPlaceholderText("Введите вашу фамилию"),
			"Иванов",
		);
		await user.type(
			screen.getByPlaceholderText("Введите ваше имя"),
			"Иван",
		);
		await user.type(
			screen.getByPlaceholderText("Введите ваше отчество"),
			"Иванович",
		);
		await user.type(
			screen.getByPlaceholderText("Введите ваш email"),
			"ivan@example.com",
		);
		await user.type(
			screen.getByPlaceholderText("Введите ваш пароль"),
			"password123",
		);
		await user.type(
			screen.getByPlaceholderText("Подтвердите ваш пароль"),
			"password123",
		);

		await user.click(screen.getByDisplayValue("Зарегистрироваться"));

		expect(consoleSpy).toHaveBeenCalledWith("submit");
		expect(consoleSpy).toHaveBeenCalledTimes(1);
	});
});
