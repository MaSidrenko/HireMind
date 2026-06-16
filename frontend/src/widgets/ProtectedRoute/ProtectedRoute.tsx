import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import type { ReactNode } from "react";
import type { UserRole } from "@/features/Auth/getMe.types";
import { PageState } from "@/widgets";


type Props = {
	children: ReactNode;
	allowedRole?: UserRole;
};

export default function ProtectedRoute({children, allowedRole}: Props) {
	const { isAuthenticated, loading, user} = useAuth();
	const normalizedRole = String(user?.role ?? "").toLowerCase();

	if(loading) {
		return (
			<PageState
				variant="loading"
				title="Проверяем доступ"
				text="Сверяем роль и состояние авторизации."
			/>
		)
	};

	if(!isAuthenticated) {
		return <Navigate to="/sign-in" />
	}

	if(
		allowedRole &&
		normalizedRole !== "admin" &&
		normalizedRole !== String(allowedRole).toLowerCase()
	) {
		return <Navigate to="/projects" replace/>
	}

	return children;
}
