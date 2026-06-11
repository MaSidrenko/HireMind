import { FREELANCER_API, apiRequest } from "@/shared";
import type { ContactRequest, Freelancer } from "./freelancersApi.types";

export async function getFreelancers() {
	return apiRequest<Freelancer[]>(`${FREELANCER_API}/freelancers`);
}

export async function sendContactRequest(freelancerId: number, message: string) {
	return apiRequest<ContactRequest>(
		`${FREELANCER_API}/${freelancerId}/contact-requests`,
		{
			method: "POST",
			body: message,
		},
	);
}

export async function getContactRequests() {
	return apiRequest<ContactRequest[]>(`${FREELANCER_API}/contact-requests`);
}
