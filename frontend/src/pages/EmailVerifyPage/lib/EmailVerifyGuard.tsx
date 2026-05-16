import { Navigate, Outlet } from "react-router-dom";

export default function EmailVerifyGuard() {
	const isAllowed = sessionStorage.getItem("emailVerifyAllowed") === "true";

	if (!isAllowed) {
		return <Navigate to="/register" replace />;
	}

	return <Outlet />;
}