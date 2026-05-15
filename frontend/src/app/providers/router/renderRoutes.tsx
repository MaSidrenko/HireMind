import { Route } from "react-router-dom";
import type { AppPage } from "@/shared";
import ProtectedRoute from "@/widgets/ProtectedRoute/ProtectedRoute";
import GuestRoute from "@/widgets/GuestRoute/GuestRoute";

export function renderRoutes(pages: AppPage[]) {
	return pages.map(({ path, component: Component, access = "public" }) => {
		let element = <Component />;

		if (access === "Client" || access === "Freelancer") {
			element = (
				<ProtectedRoute allowedRole={access}>
					<Component />
				</ProtectedRoute>
			);
		}

		if (access === "private") {
			element = (
				<ProtectedRoute>
					<Component />
				</ProtectedRoute>
			);
		}

		if (access === "guest") {
			element = (
				<GuestRoute>
					<Component />
				</GuestRoute>
			);
		}

		return <Route key={path} path={path} element={element} />;
	});
}
