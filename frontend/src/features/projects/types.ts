export type OrderStatus =
	| "draft"
	| "published"
	| "paused"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "archived";

export type BudgetType = "fixed" | "hourly";
export type Currency = "RUB" | "USD" | "EUR";
export type WorkflowStage = "raw" | "clarification" | "brief" | "review" | "approved";
export type ScopeBucket = "included" | "excluded" | "later";
export type RiskLevel = "low" | "medium" | "high";
export type ProposalStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type BriefSectionKey =
	| "goal"
	| "audience"
	| "screens"
	| "features"
	| "content"
	| "design"
	| "constraints"
	| "openQuestions";

export type BriefSections = Record<BriefSectionKey, string>;

export type ClarificationQuestion = {
	id: number;
	question: string;
	importance: RiskLevel;
	answer: string;
	options: string[];
};

export type ScopeItem = {
	id: number;
	title: string;
	description: string;
	bucket: ScopeBucket;
};

export type DoneCriterion = {
	id: number;
	text: string;
	checked: boolean;
};

export type RiskItem = {
	id: number;
	title: string;
	level: RiskLevel;
	impact: string;
	action: string;
	resolved: boolean;
};

export type ProjectProposal = {
	id: number;
	projectId: number;
	freelancerId: number;
	freelancerName: string;
	message: string;
	price: number;
	currency: Currency;
	estimatedDays: number;
	status: ProposalStatus;
	createdAt: string;
};

export type ProjectOrder = {
	id: number;
	hirerId: number;
	hirerName: string;
	selectedFreelancerId: number | null;
	selectedFreelancerName: string | null;
	title: string;
	shortDescription: string;
	rawDescription: string;
	technicalSpecification: string;
	status: OrderStatus;
	workflowStage: WorkflowStage;
	category: string;
	budgetMin: number;
	budgetMax: number;
	currency: Currency;
	budgetType: BudgetType;
	skills: string[];
	proposalsCount: number;
	proposals: ProjectProposal[];
	publishedAt: string | null;
	updatedAt: string;
	companyName: string;
	aiGenerated: boolean;
	readinessScore: number;
	briefSections: BriefSections;
	clarificationQuestions: ClarificationQuestion[];
	scopeItems: ScopeItem[];
	doneCriteria: DoneCriterion[];
	risks: RiskItem[];
	approvals: {
		client: boolean;
		freelancer: boolean;
	};
};

export type CreateProjectInput = {
	hirerId: number;
	hirerName: string;
	title: string;
	companyName: string;
	category: string;
	rawDescription: string;
	budgetMin: number;
	budgetMax: number;
	currency: Currency;
	budgetType: BudgetType;
	skills: string[];
	aiSummary?: string;
	briefSections?: BriefSections;
	clarificationQuestions?: ClarificationQuestion[];
	risks?: RiskItem[];
};
