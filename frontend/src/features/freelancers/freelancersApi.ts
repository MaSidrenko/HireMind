import { apiRequest } from "@/shared";
import type { ContactRequest, Freelancer } from "./freelancersApi.types";

export async function getFreelancers() {
	return apiRequest<Freelancer[]>("/freelancers");
}

export async function sendContactRequest(request: ContactRequest) {
	return apiRequest<ContactRequest>(`/freelancers/${request.freelancerId}/contact-requests`, {
		method: "POST",
		body: request,
	});
}

export async function getContactRequests() {
	return apiRequest<ContactRequest[]>("/contact-requests");
}