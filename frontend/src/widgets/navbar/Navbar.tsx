import type { AppPage } from "@/shared";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

type NavbarProps = {
	links: AppPage[];
};

export default function Navbar({ links }: NavbarProps) {
	return (
		<nav className="navbar">
			{/* <div className="logo-container"> */}
			<div className="logo-container">
			<div className="logo-icon">H</div>
				<span className="text-logo">HireMind</span>
			</div>
			{/* </div> */}
			<div className="navlinks">
				{links
					.filter((link) => link.showInNavbar)
					.map((link) => (
						<NavLink
							key={link.path}
							className="navlink"
							to={link.path}
						>
							{link.label}
						</NavLink>
					))}
			</div>
		</nav>
	);
}
