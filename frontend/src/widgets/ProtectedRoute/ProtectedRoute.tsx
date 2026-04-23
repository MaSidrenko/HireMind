import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export default function ProtectedRoute({children}: Props) {
	const { isAuthenticated, loading } = useAuth();

	if(loading) {
		return <div>Проверка авторизации....</div>
	};

	if(!isAuthenticated) {
		return <Navigate to="/sign-in" />
	}

	return children;
}