import { NavLink, Route, Routes } from "react-router-dom";
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
						The project was created for educational and research
						purposes
					</span>
				</div>
				<hr className="footer-divider" />
				<div className="links-footer">
					<NavLink
						key="/contacts"
						to="/contacts"
						className="link-footer"
					>
						Contacts
					</NavLink>
					<NavLink key="/about" to="/about" className="link-footer">
						About Us
					</NavLink>
			
				</div>
				<div className="copyrights">
					<p>
						All rights reserved &copy;{" "}
						{new Date().getFullYear()}{" "}
					</p>
					<p className="footer-confidentiality">Confidentiality</p>
				</div>
			</div>
		</footer>
	);
}
