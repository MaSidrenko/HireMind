import type { AppPage } from "@/shared";
import { HomePage, SignUp, SignIn } from "@/pages/index";
export const PageRoutes: AppPage[] = [
	{
		path: "/",
		label: "Home",
		component: HomePage,
		showInNavbar: true
	},
	{
		path: "/sign-up",
		label: "Sign Up",
		component: SignUp,
		showInNavbar: true
	},
	{
		path: "/sign-in",
		label: "Sign In",
		component: SignIn,
		showInNavbar: true
	},
];