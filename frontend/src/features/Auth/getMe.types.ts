// export type UserRole = "freelancer" | "client";

// export type Contacts = {
// 	telegram?: string;
// 	phone?: string;
// };

// export type User = {
// 	id: number;
// 	fullName: string;
// 	email: string;
// 	role: UserRole;
// 	contacts: Contacts;
// 	companyName?: string;
// 	isOnline: boolean;
// };

export type UserRole = "Freelancer" | "Client";

export type Contacts = {
	telegram?: string;
	phone?: string;
};

type BaseUser = {
	id: number;
	fullName: string;
	email: string;
	contacts: Contacts;
	isOnline: boolean;
	avatarUrl?: string;
};

export type FreelancerUser = BaseUser & {
	role: "Freelancer";
	skills: string[];
};

export type ClientUser = BaseUser & {
	role: "Client";
	companyName?: string;
};

export type User = FreelancerUser | ClientUser;
