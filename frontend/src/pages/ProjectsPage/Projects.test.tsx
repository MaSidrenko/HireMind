import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectById, getProjects } from "../../features/projects/projectsApi";
import { updateProjectRequest } from "../../features/projects/projectsApi";
import { useAuth } from "../../features/Auth/AuthContext";
import { ApiError } from "@/shared";
import type { ProjectOrder } from "../../features/projects/types";
import Projects from "./Projects";

vi.mock("../../features/projects/projectsApi", () => ({
	getProjectById: vi.fn(),
	getProjects: vi.fn(),
	updateProjectRequest: vi.fn(),
}));

vi.mock("../../features/Auth/AuthContext", () => ({
	useAuth: vi.fn(),
}));


const mockedGetProjects = vi.mocked(getProjects);
const mockedGetProjectById = vi.mocked(getProjectById);
const mockedUpdateProjectRequest = vi.mocked(updateProjectRequest);
const mockedUseAuth = vi.mocked(useAuth);

function makeOrder(partial: Partial<ProjectOrder> = {}): ProjectOrder {
	return {
		id: 1,
		hirerId: 7,
		hirerName: "Анна Заказчик",
		selectedFreelancerId: null,
		selectedFreelancerName: null,
		title: "React-заказ",
		shortDescription: "Короткое описание",
		rawDescription: "Нужно сделать понятный интерфейс для дипломного проекта.",
		technicalSpecification: "",
		status: "published",
		workflowStage: "brief",
		category: "Веб-разработка",
		budgetMin: 10000,
		budgetMax: 25000,
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
			goal: "Создать понятный MVP для дипломной демонстрации.",
			audience: "Комиссия, заказчики и фрилансеры проекта.",
			screens: "Главная, заказы, карточка заказа и профиль.",
			features: "Фильтрация, создание заказов и отклики.",
			content: "Данные заказчика и описание проекта.",
			design: "Черно-оранжевый рабочий интерфейс.",
			constraints: "Без платежей и внутреннего чата в MVP.",
			openQuestions: "Какие критерии приемки финальные?",
		},
		clarificationQuestions: [],
		scopeItems: [],
		doneCriteria: [],
		risks: [],
		approvals: { client: false, freelancer: false },
		...partial,
	};
}

function renderProjects(initialEntry = "/projects") {
	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route path="/projects" element={<Projects />} />
				<Route path="/projects/new" element={<Projects />} />
				<Route path="/projects/:projectId" element={<Projects />} />
			</Routes>
		</MemoryRouter>,
	);
}

describe("Projects", () => {
	beforeEach(() => {
		mockedGetProjects.mockReset();
		mockedGetProjectById.mockReset();
		mockedUpdateProjectRequest.mockReset();
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
	});

	it("loads projects and opens selected order workspace", async () => {
		const user = userEvent.setup();
		mockedGetProjects.mockResolvedValueOnce([makeOrder()]);
		mockedGetProjectById.mockResolvedValueOnce(makeOrder());

		renderProjects();

		expect(screen.getByText("Загружаем заказы")).toBeInTheDocument();
		await user.click(await screen.findByRole("button", { name: "Открыть" }));

		expect(
			await screen.findByRole("button", { name: "Посмотреть другие заказы" }),
		).toBeInTheDocument();
		expect(screen.getByDisplayValue("React-заказ")).toBeInTheDocument();
	});

	it("shows project list load error", async () => {
		mockedGetProjects.mockRejectedValueOnce(new Error("network"));

		renderProjects();

		expect(await screen.findByText("Не удалось загрузить заказы")).toBeInTheDocument();
	});

	it("shows not found state for missing project id", async () => {
		mockedGetProjectById.mockRejectedValueOnce(new ApiError("missing", 404, null));

		renderProjects("/projects/404");

		expect(await screen.findByText("Заказ не найден")).toBeInTheDocument();
	});
});
