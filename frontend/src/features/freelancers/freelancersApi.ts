import { apiRequest } from "@/shared";
import type { ContactRequest, Freelancer } from "./freelancersApi.types";

export async function getFreelancers() {
	return apiRequest<Freelancer[]>("Freelancer/freelancers");
}

export async function sendContactRequest(freelancerId: number, message: string) {
	return apiRequest<ContactRequest>(`/Freelancer/${freelancerId}/contact-requests`, {
		method: "POST",
		body: message ,
	});
}

export async function getContactRequests() {
	return apiRequest<ContactRequest[]>("Freelancer/contact-requests");
}