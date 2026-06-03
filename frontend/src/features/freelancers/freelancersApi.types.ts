export type Freelancer = {
	id: number;
	fullName: string;
	// headline: string;
	// bio: string;
	rating: number;
	hourlyRate: number;
	currency: "RUB" | "USD" | "EUR";
	skills: string[];
	completedProjects: number;
	isOnline: boolean;
	contacts: {
		email: string;
		telegram: string;
		phone: string;
	};
};

export type ContactRequest = {
	id?: number;
	freelancerId: number;
	projectId?: number;
	message: string;
	status: "sent" | "accepted" | "declined";
	createdAt: string;
};