import "./Contacts.css";

const GithubIcon = () => (
	<svg
		width="32"
		height="32"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.263.82-.582 0-.288-.01-1.05-.015-2.06-3.338.725-4.042-1.61-4.042-1.61-.546-1.388-1.333-1.758-1.333-1.758-1.09-.745.082-.73.082-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.335-5.467-5.93 0-1.31.468-2.382 1.235-3.222-.123-.303-.535-1.523.118-3.176 0 0 1.008-.322 3.3 1.23A11.48 11.48 0 0 1 12 5.803c1.02.005 2.045.138 3.003.404 2.29-1.552 3.295-1.23 3.295-1.23.655 1.653.243 2.873.12 3.176.77.84 1.232 1.912 1.232 3.222 0 4.607-2.807 5.622-5.48 5.92.43.372.813 1.102.813 2.222 0 1.605-.015 2.898-.015 3.293 0 .322.216.7.825.58C20.565 21.795 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
	</svg>
);

const contactItems = [
	{
		label: "Email",
		value: "nexon863@gmail.com",
		description: "Для вопросов по продукту и учебному проекту.",
	},
	{
		label: "Telegram",
		value: "@dark_soulBattle",
		description: "Для коротких сообщений и быстрых уточнений.",
	},
	{
		label: "Git",
		value: "GitHub",
		href: "https://github.com/MaSidrenko/HireMind/tree/develop",
		icon: <GithubIcon />,
		description: "Репозиторий проекта",
	},
	{
		label: "Статус",
		value: "MVP приложение",
		description: "Для дипломной работы, с потенциальным выходом на рынок",
	},
];

export default function Contacts() {
	return (
		<main className="contacts-page">
			<section className="contacts-hero">
				<span className="contacts-kicker">Контакты</span>
				<h1>Связь по продукту и демонстрации</h1>
				<p>
					HireMind сейчас собран как MVP: экраны, данные лежат в бд,
					авторизация, создание заказов и работа с брифом.
				</p>
			</section>

			<section className="contacts-grid">
				{contactItems.map((item) => (
					<article key={item.label} className="contacts-card">
						<span>{item.label}</span>

						<div className="contacts-value">
							{item.href ? (
								<a
									className="contacts-link-icon"
									href={item.href}
									target="_blank"
									rel="noreferrer"
									aria-label="Открыть GitHub репозиторий"
								>
									{item.icon}
								</a>
							) : (
								<strong>{item.value}</strong>
							)}
						</div>

						<p>{item.description}</p>
					</article>
				))}
			</section>
		</main>
	);
}
