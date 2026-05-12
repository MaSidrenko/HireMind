import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Projects.css";
import { useEffect, useMemo, useState } from "react";
import { getProjects, updateProjectRequest } from "@/features/projects/projectsApi.ts";
import { useAuth } from "@/features";
import type { ProjectOrder } from "@/features/projects/types";
import { EmptyState } from "./components/EmptyState";
import CreateOrderPage from "./CreateOrderPage";
import ProjectWorkspacePage from "./ProjectWorkspacePage.tsx";
import OrdersPage from "./OrdersPage";

export default function Projects() {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams<{ projectId?: string }>();
	const { user } = useAuth();
	const [orders, setOrders] = useState<ProjectOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	useEffect(() => {
		void getProjects()
			.then((items) => {
				setOrders(items);
			})
			.catch(() => setLoadError("Не удалось загрузить заказы"))
			.finally(() => setLoading(false));
	}, []);

	const currentOrderId = params.projectId ? Number(params.projectId) : null;
	const currentOrder = useMemo(
		() => orders.find((order) => order.id === currentOrderId),
		[currentOrderId, orders],
	);

	const persist = (nextOrders: ProjectOrder[]) => {
		setOrders(nextOrders);
	};

	const updateOrder = async (nextOrder: ProjectOrder) => {
		const previousOrders = orders;
		persist(orders.map((order) => (order.id === nextOrder.id ? nextOrder : order)));
		try {
			await updateProjectRequest(nextOrder);
		} catch (error) {
			persist(previousOrders);
			throw error;
		}
	};

	if (location.pathname.endsWith("/new")) {
		return (
			<CreateOrderPage
				onBack={() => navigate("/projects")}
				onCreated={(order) => {
					persist([order, ...orders]);
					navigate(`/projects/${order.id}`);
				}}
			/>
		);
	}

	if (currentOrderId) {
		if (!currentOrder && loading) {
			return (
				<main className="orders-page">
					<h2 className="orders-loading">Загрузка заказа...</h2>
				</main>
			);
		}

		if (!currentOrder) {
			return (
				<main className="orders-page">
					<EmptyState title="Заказ не найден" text="В локальных данных нет такого заказа." action="К заказам" onAction={() => navigate("/projects")} />
				</main>
			);
		}

		return (
			<ProjectWorkspacePage
				key={`${currentOrder.id}-${currentOrder.updatedAt}`}
				order={currentOrder}
				canEdit={user?.role === "client" && currentOrder.hirerId === user.id}
				onBack={() => navigate("/projects")}
				onChange={updateOrder}
			/>
		);
	}

	return (
		<OrdersPage
			loading={loading}
			error={loadError}
			orders={orders}
			onCreate={() => navigate("/projects/new")}
			onOpen={(id) => navigate(`/projects/${id}`)}
		/>
	);
}
