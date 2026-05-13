import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useAuth } from "../../features";
import SignUp from "./SignUp";

vi.mock("@/features", () => ({
	useAuth: vi.fn(),
}));

vi.mock("@/widgets/contextStripMenu/contextStripMenu", () => ({
	default: ({
		title,
		items,
		onSelect,
	}: {
		title: string;
		items: string[];
		onSelect: (item: string) => void;
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

const mockedUseAuth = vi.mocked(useAuth);
const signUpMock = vi.fn();

function renderSignUp() {
	return render(
		<MemoryRouter initialEntries={["/sign-up"]}>
			<Routes>
				<Route path="/sign-up" element={<SignUp />} />
				<Route path="/projects" element={<div>Projects page</div>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("SignUp", () => {
	beforeEach(() => {
		signUpMock.mockResolvedValue(undefined);
		mockedUseAuth.mockReturnValue({
			user: null,
			isAuthenticated: false,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: signUpMock,
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);
	});

	it("Render basic forms", () => {
		renderSignUp();

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

		renderSignUp();

		await user.click(screen.getByRole("button", { name: "Заказчик" }));
		expect(
			screen.getByPlaceholderText("Введите название вашей компании"),
		).toBeInTheDocument();
	});

	it("Hide company field when user role is 'Фрилансер'", async () => {
		const user = userEvent.setup();
		renderSignUp();

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

		renderSignUp();

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
			"Password123!",
		);

		await user.type(
			screen.getByPlaceholderText("Подтвердите ваш пароль"),
			"Password123!",
		);

		await user.click(screen.getByRole("button", { name: "Фрилансер" }));

		await user.type(
			screen.getByPlaceholderText("Введите ваш Telegram ID"),
			"@ivan",
		);
		await user.type(
			screen.getByPlaceholderText("+7 999 123 45 67"),
			"+79991234567",
		);

		await user.click(screen.getByDisplayValue("Зарегистрироваться"));

		await waitFor(() => {
			expect(signUpMock).toHaveBeenCalledWith({
				fullName: "Иванов Иван Иванович",
				email: "ivan@example.com",
				password: "Password123!",
				role: "freelancer",
				companyName: "",
				contacts: {
					telegram: "@ivan",
					phone: "+79991234567",
				},
			});
		});

		expect(screen.getByText("Projects page")).toBeInTheDocument();
	});
});
