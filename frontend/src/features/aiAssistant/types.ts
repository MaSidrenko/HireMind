// import type { BriefSections, ClarificationQuestion, RiskItem } from "@/features/projects";
import type { BriefSections } from "../projects/types";
import type { ClarificationQuestion } from "../projects/types";
import type { RiskItem } from "../projects/types";

export type AiBriefResult = {
	summary: string;
	briefSections: BriefSections;
	questions: ClarificationQuestion[];
	risks: RiskItem[];
};

export type AiMessage = {
	id: number;
	role: "user" | "assistant";
	content: string;
};
