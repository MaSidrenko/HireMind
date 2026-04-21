import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Home from "./Home";
import { Projects } from "../ProjectsPage";
import { SignUp } from "../SignUpPage";
import { SignIn } from "../SignInPage";

function renderHome() {
	return render(
		<MemoryRouter initialEntries={["/"]}>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/sign-in" element={<SignIn />} />
				<Route path="/sign-up" element={<SignUp />} />
				<Route path="/projects" element={<Projects/>} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("Home", () => {
	it("renders main content", () => {
		renderHome();

		expect(screen.getByText(/HireMind:/i)).toBeInTheDocument();
		expect(screen.getByText(/ИИ формирует ТЗ./i)).toBeInTheDocument();
		expect(screen.getByText(/Вы занимаетесь делом./i)).toBeInTheDocument();

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

	it("renders category cards", () => {
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
	});

	it('navigates to "/sign-in" after clicking "Заказать услугу"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(
			screen.getByRole("button", { name: /Заказать услугу/i }),
		);

		expect(
			screen.getByRole("heading", { name: /Sign in - Page in development/i }),
		).toBeInTheDocument();
	});

	it('navigates to "/sign-in" after clicking "Найти работу"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(screen.getByRole("button", { name: /Найти работу/i }));

		expect(
			screen.getByRole("heading", { name: /Sign in - Page in development/i }),
		).toBeInTheDocument();
	});

	it('navigates to "/sign-up" after clicking "Зарегистрироваться"', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(
			screen.getByRole("button", { name: /Зарегистрироваться/i }),
		);

		expect(
			screen.getByRole("heading", { name: /Sign up - Page in development/i }),
		).toBeInTheDocument();
	});

	it('navigates to "/projects" after clicking a category card', async () => {
		const user = userEvent.setup();
		renderHome();

		await user.click(screen.getByRole("link", { name: /Веб-разработка/i }));

		expect(
			screen.getByRole("heading", { name: /Project - Page in development/i }),
		).toBeInTheDocument();
	});
});
