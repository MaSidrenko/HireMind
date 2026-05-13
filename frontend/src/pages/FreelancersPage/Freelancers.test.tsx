import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatBudget } from "../../features/projects/projectFormatters";
import {
	getContactRequests,
	getFreelancers,
	sendContactRequest,
} from "../../features/freelancers/freelancersApi";
import Freelancers from "./Freelancers";

vi.mock("../../features/projects/projectFormatters", () => ({
	formatBudget: vi.fn(),
}));

vi.mock("../../features/freelancers/freelancersApi", () => ({
	getContactRequests: vi.fn(),
	getFreelancers: vi.fn(),
	sendContactRequest: vi.fn(),
}));

const mockedFormatBudget = vi.mocked(formatBudget);
const mockedGetContactRequests = vi.mocked(getContactRequests);
const mockedGetFreelancers = vi.mocked(getFreelancers);
const mockedSendContactRequest = vi.mocked(sendContactRequest);

const freelancer = {
	id: 1,
	fullName: "Иван Фрилансер",
	headline: "Frontend developer",
	bio: "Делаю интерфейсы",
	rating: 4.8,
	hourlyRate: 1000,
	currency: "RUB" as const,
	skills: ["React", "TypeScript"],
	completedProjects: 12,
	isOnline: true,
	contacts: {
		email: "ivan@example.com",
		telegram: "@ivan",
		phone: "+79991234567",
	},
};

describe("Freelancers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedFormatBudget.mockReturnValue("1000 ₽ / час");
		mockedGetContactRequests.mockResolvedValue([]);
		mockedSendContactRequest.mockResolvedValue({
			id: 1,
			freelancerId: 1,
			message: "message",
			status: "sent",
			createdAt: "2026-05-13T00:00:00.000Z",
		});
	});

	it("renders loading and retryable error state", async () => {
		const user = userEvent.setup();
		mockedGetFreelancers
			.mockRejectedValueOnce(new Error("network"))
			.mockResolvedValueOnce([freelancer]);

		render(<Freelancers />);

		expect(screen.getByText("Загружаем фрилансеров")).toBeInTheDocument();
		expect(
			await screen.findByText("Не удалось загрузить список фрилансеров"),
		).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Повторить" }));

		expect(await screen.findByText("Иван Фрилансер")).toBeInTheDocument();
		expect(mockedGetFreelancers).toHaveBeenCalledTimes(2);
	});

	it("renders empty state", async () => {
		mockedGetFreelancers.mockResolvedValue([]);

		render(<Freelancers />);

		expect(await screen.findByText("Специалисты не найдены")).toBeInTheDocument();
	});

	it("renders freelancer list", async () => {
		mockedGetFreelancers.mockResolvedValue([freelancer]);

		render(<Freelancers />);

		expect(await screen.findByText("Иван Фрилансер")).toBeInTheDocument();
		expect(screen.getByText("React")).toBeInTheDocument();
		expect(screen.getByText("1000 ₽ / час")).toBeInTheDocument();
	});

	it("filters freelancers by skill and clears empty filter", async () => {
		const user = userEvent.setup();
		mockedGetFreelancers.mockResolvedValue([
			freelancer,
			{
				...freelancer,
				id: 2,
				fullName: "Ольга Дизайнер",
				headline: "Product designer",
				skills: ["Figma"],
			},
		]);

		render(<Freelancers />);

		await screen.findByText("Иван Фрилансер");
		await user.type(screen.getByPlaceholderText("Навык, например React"), "figma");

		expect(screen.queryByText("Иван Фрилансер")).not.toBeInTheDocument();
		expect(screen.getByText("Ольга Дизайнер")).toBeInTheDocument();

		await user.clear(screen.getByPlaceholderText("Навык, например React"));
		await user.type(screen.getByPlaceholderText("Навык, например React"), "vue");
		await user.click(screen.getByRole("button", { name: "Очистить фильтр" }));

		expect(screen.getByText("Иван Фрилансер")).toBeInTheDocument();
		expect(screen.getByText("Ольга Дизайнер")).toBeInTheDocument();
	});

	it("opens contact panel and sends contact request", async () => {
		const user = userEvent.setup();
		mockedGetFreelancers.mockResolvedValue([freelancer]);

		render(<Freelancers />);

		await user.click(await screen.findByRole("button", { name: "Связаться" }));
		expect(screen.getByText("@ivan · ivan@example.com")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Отправить заявку" }));

		expect(mockedSendContactRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				freelancerId: 1,
				status: "sent",
			}),
		);
		expect(await screen.findByText("Статус: отправлена")).toBeInTheDocument();
	});

	it("does not send duplicate request for freelancer with sent request", async () => {
		const user = userEvent.setup();
		mockedGetFreelancers.mockResolvedValue([freelancer]);
		mockedGetContactRequests.mockResolvedValue([
			{
				id: 10,
				freelancerId: 1,
				message: "Уже отправлено",
				status: "sent",
				createdAt: "2026-05-13T00:00:00.000Z",
			},
		]);

		render(<Freelancers />);

		await user.click(
			await screen.findByRole("button", { name: "Заявка отправлена" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Заявка уже отправлена" }),
		);

		expect(mockedSendContactRequest).not.toHaveBeenCalled();
	});
});
