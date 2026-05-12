import { useState } from "react";
// import { askProjectAi, generateAiBrief, type AiBriefResult, type ProjectOrder } from "@/features";
import { askProjectAi, generateAiBrief } from "@/features/aiAssistant/aiAssistntAPI";
import type { AiBriefResult } from "@/features/aiAssistant/types";
import type { ProjectOrder } from "@/features/projects/types";

type AiAssistantPanelProps = {
	order: ProjectOrder;
	onApply?: (result: AiBriefResult) => void;
};

export function AiAssistantPanel({ order, onApply }: AiAssistantPanelProps) {
	const [prompt, setPrompt] = useState("");
	const [answer, setAnswer] = useState("Спросите, что уточнить в ТЗ, scope или рисках.");
	const [loading, setLoading] = useState(false);
	const [briefResult, setBriefResult] = useState<AiBriefResult | null>(null);
	const [generating, setGenerating] = useState(false);

	const submit = async () => {
		if (!prompt.trim()) return;
		setLoading(true);
		setAnswer(await askProjectAi(order, prompt));
		setLoading(false);
	};

	const generateBrief = async () => {
		setGenerating(true);
		const result = await generateAiBrief({
			title: order.title,
			category: order.category,
			rawDescription: order.rawDescription,
		});
		setBriefResult(result);
		setAnswer(result.summary);
		setGenerating(false);
	};

	return (
		<section className="ai-panel">
			<div>
				<span className="hm-kicker">AI помощник</span>
				<h3>Уточнение проекта</h3>
			</div>
			<textarea
				value={prompt}
				onChange={(event) => setPrompt(event.target.value)}
				placeholder="Например: какие риски есть по срокам?"
			/>
			<button type="button" className="hm-button" onClick={submit} disabled={loading}>
				{loading ? "Думаю..." : "Спросить ИИ"}
			</button>
			<button type="button" className="hm-button hm-button--ghost" onClick={generateBrief} disabled={generating}>
				{generating ? "Генерирую..." : "Обновить бриф ИИ"}
			</button>
			{briefResult && onApply ? (
				<button type="button" className="hm-button hm-button--ghost" onClick={() => onApply(briefResult)}>
					Применить результат
				</button>
			) : null}
			<p>{answer}</p>
		</section>
	);
}
