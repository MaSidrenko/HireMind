import type {
	BriefSections,
	ClarificationQuestion,
	DoneCriterion,
	RiskItem,
	RiskLevel,
	ScopeItem,
} from "../projects/types";
import type { AiBriefResult } from "./types";

function cleanText(value: unknown) {
	if (typeof value !== "string") {
		return "";
	}

	return value
		.replace(/\r/g, "\n")
		.replace(/[*_`]/g, "")
		.replace(/[ \t]+/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function cleanSingleLine(value: unknown) {
	return cleanText(value).replace(/\s*\n\s*/g, " ").trim();
}

function stripListPrefix(value: string) {
	return value.replace(/^[-•]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

function splitMultilineList(value: unknown) {
	const cleaned = cleanText(value);

	if (!cleaned) {
		return [];
	}

	const lines = cleaned
		.split(/\n+/)
		.map((line) => stripListPrefix(line))
		.filter(Boolean);

	if (lines.length > 1) {
		return lines;
	}

	const numbered = cleaned
		.split(/(?=\d+\.\s)/)
		.map((line) => stripListPrefix(line))
		.filter(Boolean);

	return numbered.length > 1 ? numbered : [cleanSingleLine(cleaned)];
}

function extractStepsText(value: string) {
	const match = /следующие шаги[:\s]*([\s\S]+)$/i.exec(value);

	if (!match) {
		return "";
	}

	return match[1]
		.split(/\n+/)
		.map((line) => stripListPrefix(line))
		.filter(Boolean)
		.join(" ");
}

function removeStepsSection(value: string) {
	return value.replace(/следующие шаги[:\s]*[\s\S]*$/i, "").trim();
}

function createRiskFromText(
	title: string,
	impact: string,
	level: RiskLevel,
	resolved: boolean,
	action: string,
	index: number,
): RiskItem {
	const normalizedImpact = cleanSingleLine(removeStepsSection(impact)) || cleanSingleLine(impact);
	const normalizedTitle = cleanSingleLine(title) || `Риск ${index + 1}`;

	return {
		id: index + 1,
		title: normalizedTitle,
		level,
		impact:
			normalizedImpact ||
			"Нужно дополнительно описать, как именно этот риск повлияет на проект.",
		action:
			cleanSingleLine(action) ||
			"Согласовать отдельные шаги по снижению риска.",
		resolved,
	};
}

function parseNarrativeRisks(
	value: string,
	level: RiskLevel,
	resolved: boolean,
): RiskItem[] {
	const commonAction = extractStepsText(value);
	const text = removeStepsSection(value);

	const boldMatches = Array.from(
		text.matchAll(
			/\*\*(?<title>[^*]+)\*\*\s*[—-]\s*(?<body>.*?)(?=(?:\*\*[^*]+\*\*\s*[—-])|$)/gs,
		),
	);

	if (boldMatches.length > 0) {
		return boldMatches.map((match, index) =>
			createRiskFromText(
				match.groups?.title ?? "",
				match.groups?.body ?? "",
				level,
				resolved,
				commonAction,
				index,
			),
		);
	}

	const bulletMatches = Array.from(
		text.matchAll(
			/(?:^|[\n\s:])(?:[-•]\s+|\d+\.\s+)(?<title>[A-ZА-ЯЁ][^—:\n]{2,90}?)\s*[—:-]\s*(?<body>.*?)(?=(?:[\n\s:](?:[-•]\s+|\d+\.\s+)[A-ZА-ЯЁ][^—:\n]{2,90}?\s*[—:-])|$)/gs,
		),
	);

	if (bulletMatches.length > 0) {
		return bulletMatches.map((match, index) =>
			createRiskFromText(
				match.groups?.title ?? "",
				match.groups?.body ?? "",
				level,
				resolved,
				commonAction,
				index,
			),
		);
	}

	return [];
}

export function normalizeRiskItems(risks: RiskItem[]) {
	const normalized = risks.flatMap((risk, index) => {
		const combinedText = [risk.title, risk.impact, risk.action]
			.filter((value) => typeof value === "string" && value.trim())
			.join("\n");
		const parsedNarrative = parseNarrativeRisks(
			combinedText,
			risk.level ?? "medium",
			Boolean(risk.resolved),
		);

		if (parsedNarrative.length > 0) {
			return parsedNarrative;
		}

		const stepsText = extractStepsText(combinedText);
		const impactSource = cleanText(risk.impact || combinedText);
		const title =
			cleanSingleLine(risk.title) ||
			cleanSingleLine(impactSource.split(/[.!?]/, 1)[0]) ||
			`Риск ${index + 1}`;

		return [
			createRiskFromText(
				title,
				impactSource,
				risk.level ?? "medium",
				Boolean(risk.resolved),
				risk.action || stepsText,
				index,
			),
		];
	});

	return normalized.map((risk, index) => ({
		...risk,
		id: index + 1,
	}));
}

function normalizeBriefSections(briefSections: AiBriefResult["briefSections"]): BriefSections {
	return {
		goal: cleanText(briefSections.goal),
		audience: cleanText(briefSections.audience),
		screens: cleanText(briefSections.screens),
		features: cleanText(briefSections.features),
		content: cleanText(briefSections.content),
		design: cleanText(briefSections.design),
		constraints: cleanText(briefSections.constraints),
		openQuestions: cleanText(briefSections.openQuestions),
	};
}

function normalizeQuestions(questions: ClarificationQuestion[]) {
	return questions.map((question, index) => ({
		id: index + 1,
		question: cleanSingleLine(question.question),
		importance: question.importance ?? "medium",
		answer: cleanText(question.answer),
		options: question.options
			.flatMap((option) => splitMultilineList(option))
			.map((option) => cleanSingleLine(option))
			.filter(Boolean),
	}));
}

function normalizeScopeItems(scopeItems: ScopeItem[]) {
	return scopeItems.map((item, index) => ({
		id: index + 1,
		title: cleanSingleLine(item.title),
		description: cleanText(item.description),
		bucket: item.bucket ?? "included",
	}));
}

function normalizeDoneCriteria(doneCriteria: DoneCriterion[]) {
	return doneCriteria
		.flatMap((item) =>
			splitMultilineList(item.text).map((text) => ({
				text: cleanSingleLine(text),
				checked: Boolean(item.checked),
			})),
		)
		.filter((item) => item.text.length > 0)
		.map((item, index) => ({
			id: index + 1,
			text: item.text,
			checked: item.checked,
		}));
}

export function normalizeAiBriefResult(result: AiBriefResult): AiBriefResult {
	const briefSections = result.briefSections ?? {
		goal: "",
		audience: "",
		screens: "",
		features: "",
		content: "",
		design: "",
		constraints: "",
		openQuestions: "",
	};

	return {
		summary: cleanText(result.summary),
		briefSections: normalizeBriefSections(briefSections),
		questions: normalizeQuestions(result.questions ?? []),
		scopeItems: normalizeScopeItems(result.scopeItems ?? []),
		doneCriteria: normalizeDoneCriteria(result.doneCriteria ?? []),
		risks: normalizeRiskItems(result.risks ?? []),
	};
}
