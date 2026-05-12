import { Navbar } from "@/widgets";
import { Footer } from "@/widgets";
import { Contacts, AboutUs, Projects, ProjectDetails } from "@/pages";
import "./App.css";
import { PageRoutes } from "./providers/router/routeConfig";
import { Route, Routes } from "react-router-dom";
import { renderRoutes } from "./providers/router/renderRoutes";
import { useAuth } from "@/features/Auth/AuthContext";

function App() {
	const { isAuthenticated, loading } = useAuth();
	if (loading) {
		return <div>Загрузка...</div>;
	}

	const navBarLinks = PageRoutes.filter((route) => {
		if (!route.showInNavbar) return false;

		if (route.access === "public") return true;
		if (route.access === "private") return isAuthenticated;
		if (route.access === "guest") return !isAuthenticated;

		return false;
	});

	return (
		<div>
			<Navbar links={navBarLinks}></Navbar>
			<Routes>
				{renderRoutes(PageRoutes)}
				<Route path="/contacts" element={<Contacts />} />
				<Route path="/about" element={<AboutUs />} />
				<Route path="/projects" element={<Projects />} />
				<Route path="/projects/:projectId" element={<ProjectDetails />}/>
			</Routes>
			<Footer></Footer>
		</div>
	);
}

export default App;
