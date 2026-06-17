import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Home.css";
import { useAuth } from "@/features/Auth/AuthContext";
import {
	getCategoryProjectCounts,
	getUserCount,
	type HomeCategoryName,
} from "@/features/main";

const categories: ReadonlyArray<{
	name: HomeCategoryName;
	icon: string;
	filterCategory: string;
}> = [
	{ name: "Веб-разработка", icon: "💻", filterCategory: "Разработка" },
	{ name: "Дизайн", icon: "🎨", filterCategory: "Дизайн" },
	{ name: "Копирайтинг", icon: "✍️", filterCategory: "Контент" },
	{
		name: "Мобильная разработка",
		icon: "📱",
		filterCategory: "Мобильная разработка",
	},
	{ name: "Маркетинг", icon: "📈", filterCategory: "Маркетинг" },
];

export default function Home() {
	const { isAuthenticated, loading } = useAuth();
	const navigate = useNavigate();
	const [categoryCounts, setCategoryCounts] = useState<
		Partial<Record<HomeCategoryName, number>>
	>({});
	const [userCount, setUserCount] = useState<number | null>(null);

	useEffect(() => {
		let isCancelled = false;

		void getCategoryProjectCounts(categories.map((category) => category.name))
			.then((counts) => {
				if (isCancelled) {
					return;
				}

				setCategoryCounts(counts);
			})
			.catch((error) => {
				console.error("Failed to load home page category stats", error);
			});

		void getUserCount()
			.then((users) => {
				if (isCancelled) {
					return;
				}

				setUserCount(users);
			})
			.catch((error) => {
				console.error("Failed to load home page user count", error);
			});

		return () => {
			isCancelled = true;
		};
	}, []);

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
						формирует ТЗ <br />{" "}
						<span className="home-page-another-size">
							Вы занимаетесь делом
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
							{categories.map((cat) => (
									<NavLink
										to="/projects"
										key={cat.name}
										className="category-card"
										state={{
											chosenCategory: cat.filterCategory,
										}}
									>
									<span className="category-icon">
										{cat.icon}
									</span>
									<h3 className="category-name">
										{cat.name}
									</h3>
									<span className="category-count">
										{categoryCounts[cat.name] ?? "..."}{" "}
										проектов
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
								<p className="cta-count">
									Уже {userCount ?? "..."} пользователей на
									платформе
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
