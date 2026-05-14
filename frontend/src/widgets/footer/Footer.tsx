import { NavLink } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
	return (
		<footer className="footer">
			<div className="footer-container">
				<div className="footer-top-row">
					<div className="footer-logo-container">
						<span className="footer-project-name">HireMind</span>
					</div>
					<span className="footer-info">
						Проект создан в учебных и исследовательских целях
					</span>
				</div>
				<hr className="footer-divider" />
				<div className="links-footer">
					<NavLink
						key="/contacts"
						to="/contacts"
						className="link-footer"
					>
						Контакты
					</NavLink>
					<NavLink key="/about" to="/about" className="link-footer">
						О проекте
					</NavLink>
			
				</div>
				<div className="copyrights">
					<p>
						Все права защищены &copy;{" "}
						{new Date().getFullYear()}{" "}
					</p>
					<p className="footer-confidentiality">Конфиденциальность</p>
				</div>
			</div>
		</footer>
	);
}
