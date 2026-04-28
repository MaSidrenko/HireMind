import type { AppPage } from "@/shared";
import { HomePage, SignUp, SignIn, Profile } from "@/pages/index";
export const PageRoutes: AppPage[] = [
	{
		path: "/",
		label: "Главная",
		component: HomePage,
		showInNavbar: true,
		access: "public"
	},
	{
		path: "/sign-up",
		label: "Регистрация",
		component: SignUp,
		showInNavbar: true,
		access: "guest",
	},
	{
		path: "/sign-in",
		label: "Вход",
		component: SignIn,
		showInNavbar: true,
		access: "guest",
	},
	{
		path: "/profile",
		label: "Профиль",
		component: Profile,
		showInNavbar: true,
		access: "public",
	},
];