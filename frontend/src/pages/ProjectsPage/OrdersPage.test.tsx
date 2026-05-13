import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../features/Auth/AuthContext";
import type { ProjectOrder } from "../../features/projects/types";
import OrdersPage from "./OrdersPage";

vi.mock("../../features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function makeOrder(partial: Partial<ProjectOrder>): ProjectOrder {
	return {
		id: 1,
		hirerId: 10,
		hirerName: "Заказчик",
		selectedFreelancerId: null,
		selectedFreelancerName: null,
		title: "Заказ",
		shortDescription: "Короткое описание",
		rawDescription: "Подробное описание заказа",
		technicalSpecification: "",
		status: "published",
		workflowStage: "brief",
		category: "Разработка",
		budgetMin: 1000,
		budgetMax: 2000,
		currency: "RUB",
		budgetType: "fixed",
		skills: ["React"],
		proposalsCount: 0,
		proposals: [],
		publishedAt: "2026-05-13T00:00:00.000Z",
		updatedAt: "2026-05-13T00:00:00.000Z",
		companyName: "HireMind",
		aiGenerated: true,
		readinessScore: 80,
		briefSections: {
			goal: "",
			audience: "",
			screens: "",
			features: "",
			content: "",
			design: "",
			constraints: "",
			openQuestions: "",
		},
		clarificationQuestions: [],
		scopeItems: [],
		doneCriteria: [],
		risks: [],
		approvals: { client: false, freelancer: false },
		...partial,
	};
}

describe("OrdersPage", () => {
	beforeEach(() => {
		mockedUseAuth.mockReturnValue({
			user: null,
			isAuthenticated: false,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);
	});

	it("renders loading and error states instead of order cards", () => {
		const order = makeOrder({ title: "React-заказ" });

		const { rerender } = render(
			<OrdersPage
				orders={[order]}
				loading
				onCreate={vi.fn()}
				onOpen={vi.fn()}
			/>,
		);

		expect(screen.getByText("Загружаем заказы")).toBeInTheDocument();
		expect(screen.queryByText("React-заказ")).not.toBeInTheDocument();

		rerender(
			<OrdersPage
				orders={[order]}
				loading={false}
				error="backend unavailable"
				onCreate={vi.fn()}
				onOpen={vi.fn()}
			/>,
		);

		expect(screen.getByText("Не удалось загрузить заказы")).toBeInTheDocument();
		expect(screen.queryByText("React-заказ")).not.toBeInTheDocument();
	});

	it("shows empty state action for clients", async () => {
		const user = userEvent.setup();
		const onCreate = vi.fn();
		mockedUseAuth.mockReturnValue({
			user: {
				id: 7,
				fullName: "Анна Заказчик",
				email: "anna@example.com",
				role: "client",
				contacts: {},
				isOnline: true,
			},
			isAuthenticated: true,
			loading: false,
			refreshAuth: vi.fn(),
			signIn: vi.fn(),
			signUp: vi.fn(),
			updateProfile: vi.fn(),
			logout: vi.fn(),
		} as ReturnType<typeof useAuth>);

		render(
			<OrdersPage
				orders={[]}
				loading={false}
				onCreate={onCreate}
				onOpen={vi.fn()}
			/>,
		);

		await user.click(screen.getAllByRole("button", { name: "Создать заказ" })[1]);

		expect(screen.getByText("Заказы не найдены")).toBeInTheDocument();
		expect(onCreate).toHaveBeenCalledTimes(1);
	});

	it("filters orders by initial category from home page", () => {
		render(
			<OrdersPage
				orders={[
					makeOrder({ id: 1, title: "React-заказ", category: "Веб-разработка" }),
					makeOrder({ id: 2, title: "Дизайн-заказ", category: "Дизайн" }),
				]}
				loading={false}
				initialCategory="Дизайн"
				onCreate={vi.fn()}
				onOpen={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("option", { name: "Дизайн", selected: true }),
		).toBeInTheDocument();
		expect(screen.getByText("Дизайн-заказ")).toBeInTheDocument();
		expect(screen.queryByText("React-заказ")).not.toBeInTheDocument();
	});

	it("filters by status, query and budget range", async () => {
		const user = userEvent.setup();

		render(
			<OrdersPage
				orders={[
					makeOrder({
						id: 1,
						title: "React dashboard",
						status: "published",
						budgetMin: 10000,
						budgetMax: 20000,
					}),
					makeOrder({
						id: 2,
						title: "React admin",
						status: "draft",
						budgetMin: 50000,
						budgetMax: 80000,
					}),
					makeOrder({
						id: 3,
						title: "Design system",
						status: "published",
						budgetMin: 30000,
						budgetMax: 45000,
					}),
				]}
				loading={false}
				onCreate={vi.fn()}
				onOpen={vi.fn()}
			/>,
		);

		await user.selectOptions(screen.getAllByRole("combobox")[0], "published");
		await user.type(screen.getByPlaceholderText("Название заказа"), "react");
		await user.type(screen.getByPlaceholderText("Цена от"), "15000");
		await user.type(screen.getByPlaceholderText("Цена до"), "25000");

		expect(screen.getByText("React dashboard")).toBeInTheDocument();
		expect(screen.queryByText("React admin")).not.toBeInTheDocument();
		expect(screen.queryByText("Design system")).not.toBeInTheDocument();
	});

	it("sorts by newest update and opens selected order", async () => {
		const user = userEvent.setup();
		const onOpen = vi.fn();

		render(
			<OrdersPage
				orders={[
					makeOrder({
						id: 1,
						title: "Старый заказ",
						updatedAt: "2026-05-10T00:00:00.000Z",
					}),
					makeOrder({
						id: 2,
						title: "Новый заказ",
						updatedAt: "2026-05-13T00:00:00.000Z",
					}),
				]}
				loading={false}
				onCreate={vi.fn()}
				onOpen={onOpen}
			/>,
		);

		await user.selectOptions(screen.getAllByRole("combobox")[2], "newest");

		const titles = screen.getAllByRole("heading", { level: 2 });
		expect(titles.map((title) => title.textContent)).toEqual([
			"Новый заказ",
			"Старый заказ",
		]);

		await user.click(screen.getAllByRole("button", { name: "Открыть" })[0]);

		expect(onOpen).toHaveBeenCalledWith(2);
	});

	it("resets filters", async () => {
		const user = userEvent.setup();

		render(
			<OrdersPage
				orders={[
					makeOrder({ id: 1, title: "React-заказ", category: "Веб-разработка" }),
					makeOrder({ id: 2, title: "Дизайн-заказ", category: "Дизайн" }),
				]}
				loading={false}
				initialCategory="Дизайн"
				onCreate={vi.fn()}
				onOpen={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Сбросить" }));

		expect(screen.getByText("React-заказ")).toBeInTheDocument();
		expect(screen.getByText("Дизайн-заказ")).toBeInTheDocument();
	});
});
