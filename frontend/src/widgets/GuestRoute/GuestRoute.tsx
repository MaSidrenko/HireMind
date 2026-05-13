import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/Auth/AuthContext";
import type { ReactNode } from "react";
import { PageState } from "@/widgets";

type Props = {
	children: ReactNode;
};

export default function  GuestRoute({children}: Props) {
	const { isAuthenticated, loading } = useAuth();

	if(loading) {
		return (
			<PageState
				variant="loading"
				title="Загрузка"
				text="Проверяем, есть ли активная сессия."
			/>
		)
	}

	if(isAuthenticated) {
		return <Navigate to="/profile" replace/>
	}

	return children;
}
