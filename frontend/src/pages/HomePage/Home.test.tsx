import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("@/features/Auth/AuthContext", () => ({
	useAuth: () => ({
		user: null,
		isAuthenticated: false,
		loading: false,
		logout: vi.fn(),
	}),
}));

vi.mock("@/features/main", () => ({
	getCategoryProjectCounts: vi.fn(),
	getUserCount: vi.fn(),
}));

import Home from "./Home";
import { getCategoryProjectCounts, getUserCount } from "@/features/main";
import { Projects } from "../ProjectsPage";
import { SignUp } from "../SignUpPage";
import { SignIn } from "../SignInPage";

const mockedGetCategoryProjectCounts = vi.mocked(getCategoryProjectCounts);
const mockedGetUserCount = vi.mocked(getUserCount);

function renderHome() {
	return render(
		<MemoryRouter initialEntries={["/"]}>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/sign-in" element={<SignIn />} />
				<Route path="/sign-up" element={<SignUp />} />
				<Route path="/projects" element={<Projects />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("Home", () => {
	beforeEach(() => {
		mockedGetCategoryProjectCounts.mockReset();
		mockedGetUserCount.mockReset();
		mockedGetCategoryProjectCounts.mockResolvedValue({
			"Веб-разработка": 125,
			"Дизайн": 98,
			"Копирайтинг": 76,
			"Мобильная разработка": 54,
			"Маркетинг": 82,
		});
		mockedGetUserCount.mockResolvedValue(321);
	});

	it("renders main content", () => {
		renderHome();

		expect(screen.getByText(/HireMind:/i)).toBeInTheDocument();
		expect(screen.getByText(/ИИ формирует ТЗ/i)).toBeInTheDocument();
		expect(screen.getByText(/Вы занимаетесь делом/i)).toBeInTheDocument();

		expect(
			screen.getByRole("button", { name: /Заказать услугу/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Найти работу/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Зарегистрироваться/i }),
		).toBeInTheDocument();
	});

	it("renders category cards with backend counts", async () => {
		renderHome();

		expect(screen.getByText(/Популярные категории/i)).toBeInTheDocument();

		expect(
			screen.getByRole("link", { name: /Веб-разработка/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Дизайн/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Копирайтинг/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Мобильная разработка/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Маркетинг/i }),
		).toBeInTheDocument();

		expect(screen.getAllByRole("link")).toHaveLength(5);
		expect(await screen.findByText("125 проектов")).toBeInTheDocument();
		expect(screen.getByText("98 проектов")).toBeInTheDocument();
		expect(screen.getByText("76 проектов")).toBeInTheDocument();
		expect(screen.getByText("54 проектов")).toBeInTheDocument();
		expect(screen.getByText("82 проектов")).toBeInTheDocument();
		expect(
			screen.getByText(/Уже 321 пользователей на платформе/i),
		).toBeInTheDocument();
	});

	it('navigates to "/sign-in" after clicking "Заказать услугу"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(
			screen.getByRole("button", { name: /Заказать услугу/i }),
		);

		expect(
			screen.getByRole("heading", {
				name: /Вход/i,
			}),
		).toBeInTheDocument();
	});

	it('navigates to "/sign-in" after clicking "Найти работу"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(screen.getByRole("button", { name: /Найти работу/i }));

		expect(
			screen.getByRole("heading", {
				name: /Вход/i,
			}),
		).toBeInTheDocument();
	});

	it('navigates to "/sign-up" after clicking "Зарегистрироваться"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(
			screen.getByRole("button", { name: /Зарегистрироваться/i }),
		);

		expect(
			screen.getByRole("heading", { name: /Регистрация/i }),
		).toBeInTheDocument();

		expect(
			screen.getByPlaceholderText(/Введите ваш email/i),
		).toBeInTheDocument();

		expect(
			screen.getByRole("button", { name: /Зарегистрироваться/i }),
		).toBeInTheDocument();
	});

	it('navigates to "/projects" after clicking a category card', async () => {
		const user = userEvent.setup();
		renderHome();

		await waitFor(() => {
			expect(mockedGetCategoryProjectCounts).toHaveBeenCalled();
		});

		await user.click(screen.getByRole("link", { name: /Веб-разработка/i }));

		expect(
			screen.getByRole("heading", {
				name: /Заказы/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", {
				name: "Разработка",
				selected: true,
			}),
		).toBeInTheDocument();
	});
});
