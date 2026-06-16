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

export type UserRole = "Freelancer" | "Client" | "Admin";

export type Contacts = {
	telegram?: string;
	phone?: string;
};

export type UserCurrency = "RUB" | "USD" | "EUR";

type BaseUser = {
	id: number;
	fullName: string;
	email: string;
	contacts: Contacts;
	isOnline: boolean;
	isTelegramConnected?: boolean;
	avatarUrl?: string;
	rating: number;
};

export type FreelancerUser = BaseUser & {
	role: "Freelancer";
	skills: string[];
	hourlyRate: number | null;
	currency: UserCurrency | null;
	completedOrders: number | null;
};

export type ClientUser = BaseUser & {
	role: "Client";
	companyName?: string;
};

export type AdminUser = BaseUser & {
	role: "Admin";
	companyName?: string;
	skills?: string[];
	hourlyRate?: number | null;
	currency?: UserCurrency | null;
	completedOrders?: number | null;
};

export type User = FreelancerUser | ClientUser | AdminUser;
