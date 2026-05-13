import { Navbar } from "@/widgets";
import { Footer } from "@/widgets";
import { PageState } from "@/widgets";
import { Contacts, AboutUs, NotFound } from "@/pages";
import "./App.css";
import { PageRoutes } from "./providers/router/routeConfig";
import { Route, Routes } from "react-router-dom";
import { renderRoutes } from "./providers/router/renderRoutes";
import { useAuth } from "@/features/Auth/AuthContext";

function App() {
	const { isAuthenticated, loading, user } = useAuth();
	if (loading) {
		return (
			<PageState
				variant="loading"
				title="Загрузка HireMind"
				text="Проверяем авторизацию и готовим интерфейс."
			/>
		);
	}

	const navBarLinks = PageRoutes.filter((route) => {
		if (!route.showInNavbar) return false;

		if (route.access === "public") return true;
		if (route.access === "private") return isAuthenticated;
		if (route.access === "client")
			return isAuthenticated && user?.role === "client";
		if (route.access === "freelancer")
			return isAuthenticated && user?.role === "freelancer";
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
				<Route path="*" element={<NotFound />} />
			</Routes>
			<Footer></Footer>
		</div>
	);
}

export default App;
