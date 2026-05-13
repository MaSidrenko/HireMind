import { apiRequest } from "@/shared";
import type { ContactRequest, Freelancer } from "./freelancersApi.types";

export async function getFreelancers() {
	return apiRequest<Freelancer[]>("/api/freelancers");
}

export async function sendContactRequest(request: ContactRequest) {
	return apiRequest<ContactRequest>(`/api/freelancers/${request.freelancerId}/contact-requests`, {
		method: "POST",
		body: request,
	});
}

export async function getContactRequests() {
	return apiRequest<ContactRequest[]>("/api/contact-requests");
}