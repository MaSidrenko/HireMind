import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import type { ReactNode } from "react";
import type { UserRole } from "@/features/Auth/getMe.types";


type Props = {
	children: ReactNode;
	allowedRole?: UserRole;
};

export default function ProtectedRoute({children, allowedRole}: Props) {
	const { isAuthenticated, loading, user} = useAuth();

	if(loading) {
		return <div>Проверка авторизации....</div>
	};

	if(!isAuthenticated) {
		return <Navigate to="/sign-in" />
	}

	if(allowedRole && user?.role !== allowedRole) {
		return <Navigate to="/projects" replace/>
	}

	return children;
}