import { Navbar } from "@/widgets";
import { Footer } from "@/widgets";
import { PageState } from "@/widgets";
import {
	Contacts,
	AboutUs,
	NotFound,
	EmailChangeConfirm,
	EmailVerify,
} from "@/pages";
import "./App.css";
import { PageRoutes } from "./providers/router/routeConfig";
import { Route, Routes } from "react-router-dom";
import { renderRoutes } from "./providers/router/renderRoutes";
import { useAuth } from "@/features/Auth/AuthContext";
import EmailVerifyGuard from "@/pages/EmailVerifyPage/lib/EmailVerifyGuard";
import ScrollToTopButton from "@/widgets/ScrollToTopButton/ScrollToTopButton";

function App() {
	const { isAuthenticated, loading, user } = useAuth();
	const normalizedRole = String(user?.role ?? "").toLowerCase();
	const isAdmin = normalizedRole === "admin";
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
			return isAuthenticated && (normalizedRole === "client" || isAdmin);
		if (route.access === "Freelancer")
			return isAuthenticated && (normalizedRole === "freelancer" || isAdmin);
		if (route.access === "Admin") return isAuthenticated && isAdmin;
		if (route.access === "guest") return !isAuthenticated;

		return false;
	});

	return (
		<div>
			<ScrollToTopButton />
			<Navbar links={navBarLinks}></Navbar>
			<Routes>
				{renderRoutes(PageRoutes)}
				<Route path="/contacts" element={<Contacts />} />
				<Route path="/about" element={<AboutUs />} />
				<Route path="*" element={<NotFound />} />
				<Route path="/email-change/confirm" element={<EmailChangeConfirm />} />
				<Route element={<EmailVerifyGuard />}>
					<Route path="/email-code" element={<EmailVerify />} />
				</Route>
			</Routes>
			<Footer></Footer>
		</div>
	);
}

export default App;
