import type { AppPage } from "@/shared";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

type NavbarProps = {
	links: AppPage[];
};

export default function Navbar({ links }: NavbarProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<nav className="navbar">
			<div className="logo-container">
				<div className="logo-icon">H</div>
				<span className="text-logo">HireMind</span>
			</div>
			<button
				type="button"
				className="navbar-toggle"
				aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
				aria-expanded={isOpen}
				onClick={() => setIsOpen((current) => !current)}
			>
				<span />
				<span />
				<span />
			</button>
			<div className={`navlinks ${isOpen ? "navlinks--open" : ""}`}>
				{links
					.filter((link) => link.showInNavbar)
					.map((link) => (
						<NavLink
							key={link.path}
							className="navlink"
							to={link.path}
							onClick={() => setIsOpen(false)}
						>
							{link.label}
						</NavLink>
					))}
			</div>
		</nav>
	);
}
