import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProjectOrder } from "../../../features/projects/types";
import { OrderCard } from "./OrderCard";

const order: ProjectOrder = {
	id: 77,
	hirerId: 7,
	hirerName: "Анна Заказчик",
	selectedFreelancerId: null,
	selectedFreelancerName: null,
	title: "Лендинг",
	shortDescription: "Короткое описание заказа",
	rawDescription: "Подробное описание заказа",
	technicalSpecification: "",
	status: "published",
	workflowStage: "brief",
	category: "Дизайн",
	budgetMin: 10000,
	budgetMax: 25000,
	currency: "RUB",
	budgetType: "fixed",
	skills: ["React", "TypeScript", "CSS", "Vite", "Extra"],
	proposalsCount: 3,
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
};

describe("OrderCard", () => {
	it("renders order summary and opens selected order", async () => {
		const user = userEvent.setup();
		const onOpen = vi.fn();

		render(<OrderCard order={order} onOpen={onOpen} />);

		expect(screen.getByText("Лендинг")).toBeInTheDocument();
		expect(screen.getByText("AI-ТЗ")).toBeInTheDocument();
		expect(screen.getByText("Фикс · 3 откликов")).toBeInTheDocument();
		expect(screen.queryByText("Extra")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Открыть" }));

		expect(onOpen).toHaveBeenCalledWith(77);
	});
});
