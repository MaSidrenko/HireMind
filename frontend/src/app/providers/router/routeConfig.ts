import type { AppPage } from "@/shared";
import { HomePage, SignUp, SignIn } from "@/pages/index";
export const PageRoutes: AppPage[] = [
	{
		path: "/",
		label: "Главная",
		component: HomePage,
		showInNavbar: true
	},
	{
		path: "/sign-up",
		label: "Регистрация",
		component: SignUp,
		showInNavbar: true
	},
	{
		path: "/sign-in",
		label: "Вход",
		component: SignIn,
		showInNavbar: true
	},
];