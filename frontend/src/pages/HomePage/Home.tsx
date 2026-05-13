import { NavLink, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuth } from "@/features/Auth/AuthContext";

export default function Home() {
	const { isAuthenticated, loading } = useAuth();

	const categories = [
		{ name: "Веб-разработка", icon: "💻", count: 1250 },
		{ name: "Дизайн", icon: "🎨", count: 980 },
		{ name: "Копирайтинг", icon: "✍️", count: 756 },
		{ name: "Мобильная разработка", icon: "📱", count: 542 },
		{ name: "Маркетинг", icon: "📈", count: 823 },
	];

	const navigate = useNavigate();

	if (loading) {
		return <div>Загрузка...</div>;
	}

	return (
		<div>
			<div className="hero">
				<div className="hero-bg">
					<div className="hero-circle hero-circle-1"></div>
					<div className="hero-circle hero-circle-2"></div>
					<div className="hero-circle hero-circle-3"></div>
				</div>
				<section className="border-slogan-home-page">
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
								navigate(
									isAuthenticated ? "/profile" : "/sign-in",
								);
							}}
						>
							Заказать услугу
						</button>
						<button
							className="btn-main-page"
							onClick={() => {
								navigate(
									isAuthenticated ? "/profile" : "/sign-in",
								);
							}}
						>
							Найти работу
						</button>
					</div>
				</section>
			</div>
			<div className="hero">
				<div className="hero-bg">
					<div className="hero-circle hero-circle-1"></div>
					<div className="hero-circle hero-circle-2"></div>
					<div className="hero-circle hero-circle-3"></div>
				</div>
				<section className="categories">
					<h3 className="cat-text">Популярные категории</h3>
					<div className="container">
						<div className="categories-grid">
							{categories.map((cat, idx) => (
								<NavLink
									to="/projects"
									key={idx}
									className="category-card"
									state={{ chosenCategory: cat.name }}
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
			<div className="hero">
				<div className="hero-bg">
					<div className="hero-circle hero-circle-1"></div>
					<div className="hero-circle hero-circle-2"></div>
					<div className="hero-circle hero-circle-3"></div>
				</div>
				<section className="cta">
					<div className="container">
						<div className="cta-content">
							<h2>Готовы начать?</h2>
							<p>
								Присоединяйтесь к фрилансерам и заказчикам
								нашего сайта уже сегодня
							</p>
							{isAuthenticated ? (
								<button
									className="btn-main-page"
									onClick={() => {
										navigate("/profile");
									}}
								>
									Профиль
								</button>
							) : (
								<button
									className="btn-main-page"
									onClick={() => {
										navigate("/sign-up");
									}}
								>
									Зарегистрироваться
								</button>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
