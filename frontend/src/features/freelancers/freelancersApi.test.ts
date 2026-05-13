import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../shared";
import {
	getContactRequests,
	getFreelancers,
	sendContactRequest,
} from "./freelancersApi";
import type { ContactRequest, Freelancer } from "./freelancersApi.types";

vi.mock("@/shared", () => ({
	apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

describe("freelancersApi", () => {
	beforeEach(() => {
		mockedApiRequest.mockReset();
	});

	it("loads freelancers from backend endpoint", async () => {
		const freelancers: Freelancer[] = [
			{
				id: 1,
				fullName: "Иван Фрилансер",
				headline: "Frontend developer",
				bio: "Делаю интерфейсы",
				rating: 4.8,
				hourlyRate: 1200,
				currency: "RUB",
				skills: ["React"],
				completedProjects: 12,
				isOnline: true,
				contacts: {
					email: "ivan@example.com",
					telegram: "@ivan",
					phone: "+79991234567",
				},
			},
		];
		mockedApiRequest.mockResolvedValueOnce(freelancers);

		await expect(getFreelancers()).resolves.toEqual(freelancers);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/freelancers");
	});

	it("sends contact request to selected freelancer", async () => {
		const request: ContactRequest = {
			freelancerId: 7,
			projectId: 3,
			message: "Здравствуйте, хочу обсудить проект.",
			status: "sent",
			createdAt: "2026-05-13T00:00:00.000Z",
		};
		const savedRequest = { ...request, id: 44 };
		mockedApiRequest.mockResolvedValueOnce(savedRequest);

		await expect(sendContactRequest(request)).resolves.toEqual(savedRequest);

		expect(mockedApiRequest).toHaveBeenCalledWith(
			"/api/freelancers/7/contact-requests",
			{
				method: "POST",
				body: request,
			},
		);
	});

	it("loads current contact requests", async () => {
		const requests: ContactRequest[] = [
			{
				id: 1,
				freelancerId: 7,
				message: "Уже отправлено",
				status: "sent",
				createdAt: "2026-05-13T00:00:00.000Z",
			},
		];
		mockedApiRequest.mockResolvedValueOnce(requests);

		await expect(getContactRequests()).resolves.toEqual(requests);

		expect(mockedApiRequest).toHaveBeenCalledWith("/api/contact-requests");
	});
});
