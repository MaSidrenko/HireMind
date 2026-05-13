import "./AboutUs.css";

const principles = [
	{
		title: "Сначала ясность",
		text: "HireMind помогает превратить свободное описание задачи в структуру, с которой обе стороны могут работать без догадок.",
	},
	{
		title: "Scope виден заранее",
		text: "То, что входит в работу, не входит и откладывается на будущее, фиксируется до старта проекта.",
	},
	{
		title: "Готовность измеряется",
		text: "Уточнения, риски, DoD и согласование собираются в один показатель готовности к началу работы.",
	},
];

const steps = [
	"Заказчик описывает идею",
	"Появляется AI-черновик брифа",
	"Стороны закрывают уточнения",
	"Фиксируются scope, риски и DoD",
	"Бриф уходит на согласование",
];

export default function AboutUs() {
	return (
		<main className="about-page">
			<section className="about-hero">
				<span className="about-kicker">О продукте</span>
				<h1>HireMind снижает неопределённость до старта работы</h1>
				<p>
					Платформа фокусируется не на переписке и витрине профилей, а на
					согласованном понимании задачи: что нужно сделать, что не входит в
					scope и как проверить готовый результат.
				</p>
			</section>

			<section className="about-grid">
				{principles.map((item) => (
					<article key={item.title} className="about-card">
						<h2>{item.title}</h2>
						<p>{item.text}</p>
					</article>
				))}
			</section>

			<section className="about-flow">
				<div>
					<span className="about-kicker">Флоу MVP</span>
					<h2>От сырой идеи к согласованному брифу</h2>
				</div>
				<div className="about-steps">
					{steps.map((step, index) => (
						<div key={step} className="about-step">
							<span>{String(index + 1).padStart(2, "0")}</span>
							<strong>{step}</strong>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
