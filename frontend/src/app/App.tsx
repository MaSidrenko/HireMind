import { Navbar } from "@/widgets";
import { Footer } from "@/widgets";
import { PageState } from "@/widgets";
import { Contacts, AboutUs, NotFound, EmailVerify } from "@/pages";
import "./App.css";
import { PageRoutes } from "./providers/router/routeConfig";
import { Route, Routes } from "react-router-dom";
import { renderRoutes } from "./providers/router/renderRoutes";
import { useAuth } from "@/features/Auth/AuthContext";
import EmailVerifyGuard from "@/pages/EmailVerifyPage/lib/EmailVerifyGuard";

function App() {
	const { isAuthenticated, loading, user } = useAuth();
	const normalizedRole = String(user?.role ?? "").toLowerCase();
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
		if (route.access === "Client")
			return isAuthenticated && normalizedRole === "client";
		if (route.access === "Freelancer")
			return isAuthenticated && normalizedRole === "freelancer";
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
				<Route element={<EmailVerifyGuard />}>
					<Route path="/email-code" element={<EmailVerify />} />
				</Route>
			</Routes>
			<Footer></Footer>
		</div>
	);
}

export default App;
