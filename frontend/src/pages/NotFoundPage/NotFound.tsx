import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
	return (
		<main className="not-found-page">
			<section className="not-found-panel">
				<span className="not-found-kicker">404</span>
				<h1>Страница не найдена</h1>
				<p>
					Похоже, ссылка устарела или адрес набран с ошибкой. Вернитесь к
					основным разделам HireMind и продолжите работу оттуда.
				</p>
				<div className="not-found-actions">
					<Link to="/" className="not-found-button">
						На главную
					</Link>
					<Link to="/projects" className="not-found-button not-found-button--ghost">
						К заказам
					</Link>
				</div>
			</section>
		</main>
	);
}
