import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
	const categories = [
		{ name: "Веб-разработка", icon: "💻", count: 1250 },
		{ name: "Дизайн", icon: "🎨", count: 980 },
		{ name: "Копирайтинг", icon: "✍️", count: 756 },
		{ name: "Мобильная разработка", icon: "📱", count: 542 },
		{ name: "Маркетинг", icon: "📈", count: 823 },
	];

	const navigate = useNavigate();

	return (
		<div>
			<div className="hero">
				<div className="hero-bg">
					<div className="hero-circle hero-circle-1"></div>
					<div className="hero-circle hero-circle-2"></div>
					<div className="hero-circle hero-circle-3"></div>
				</div>
				<div className="border-slogan-home-page">
					<h1 className="slogan-home-page">
						<span className="highligh-home-page">HireMind:</span> ИИ
						формирует ТЗ. <br />{" "}
						<span className="home-page-another-size">
							Вы занимаетесь делом.
						</span>
					</h1>
					<div className="btn-main-page-container">
						<button
							className="btn-main-page"
							onClick={() => {
								navigate("/sign-in");
							}}
						>
							Заказать услугу
						</button>
						<button
							className="btn-main-page"
							onClick={() => {
								navigate("/sign-in");
							}}
						>
							Найти работу
						</button>
					</div>
				</div>
			</div>
			<div>
				<section className="categories">
					<h3 className="cat-text">Популярные категории</h3>
					<div className="container">
						<div className="categories-grid">
							{categories.map((cat, idx) => (
								<NavLink
									to="/projects"
									key={idx}
									className="category-card"
								>
									<span className="category-icon">
										{cat.icon}
									</span>
									<h3 className="category-name">
										{cat.name}
									</h3>
									<span className="category-count">
										{cat.count} проектов
									</span>
								</NavLink>
							))}
						</div>
					</div>
				</section>
			</div>
			<section className="cta">
				<div className="container">
					<div className="cta-content">
						<h2>Готовы начать?</h2>
						<p>
							Присоединяйтесь к thousands фрилансеров и заказчиков
							уже сегодня
						</p>
						<button
							className="btn-main-page"
							onClick={() => {
								navigate("/sign-up");
							}}
						>
							Зарегистрироваться
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
