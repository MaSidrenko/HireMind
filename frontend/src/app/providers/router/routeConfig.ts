import type { AppPage } from "@/shared";
import { HomePage } from "@/pages";
export const PageRoutes: AppPage[] = [
	{
		path: "/",
		label: "Home",
		component: HomePage,
		showInNavbar: true
	},
];