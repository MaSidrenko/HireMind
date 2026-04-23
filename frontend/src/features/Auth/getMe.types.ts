import type React from "react";

export type Contacts = {
	telegram?: string;
	phone?: string;
};

export type User = {
	id: number;
	fullName: string;
	email: string;
	role: string;
	contacts: Contacts;
	companyName?: string;
};
