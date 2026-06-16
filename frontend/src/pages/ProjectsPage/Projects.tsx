import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Projects.css";
import { useEffect, useMemo, useState } from "react";
import {
	useAuth,
	getProjectById,
	getProjects,
	updateProjectRequest,
	type ProjectOrder,
} from "@/features";
import { EmptyState } from "./components/EmptyState";
import { PageState } from "@/widgets";
import { ApiError } from "@/shared";
import CreateOrderPage from "./CreateOrderPage";
import ProjectWorkspacePage from "./ProjectWorkspacePage.tsx";
import OrdersPage from "./OrdersPage";

type ProjectsLocationState = {
	chosenCategory?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof ApiError && error.status === 404) {
		return "";
	}

	if (error instanceof ApiError) return error.message;
	return fallback;
}

function upsertOrder(orders: ProjectOrder[], nextOrder: ProjectOrder) {
	const exists = orders.some((order) => order.id === nextOrder.id);
	return exists
		? orders.map((order) => (order.id === nextOrder.id ? nextOrder : order))
		: [nextOrder, ...orders];
}

export default function Projects() {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams<{ projectId?: string }>();
	const { user } = useAuth();
	const normalizedRole = String(user?.role ?? "").toLowerCase();
	const isAdmin = normalizedRole === "admin";
	const isCreatePage = location.pathname.endsWith("/new");
	const parsedOrderId = params.projectId ? Number(params.projectId) : null;
	const currentOrderId =
		parsedOrderId !== null && Number.isFinite(parsedOrderId)
			? parsedOrderId
			: null;
	const isDetailPage = params.projectId !== undefined;
	const [orders, setOrders] = useState<ProjectOrder[]>([]);
	const [currentOrder, setCurrentOrder] = useState<ProjectOrder | null>(null);
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [loadError, setLoadError] = useState("");
	const [detailError, setDetailError] = useState("");
	const locationState = location.state as ProjectsLocationState | null;
	const initialCategory =
		typeof locationState?.chosenCategory === "string"
			? locationState.chosenCategory
			: "all";

	useEffect(() => {
		if (isCreatePage || isDetailPage) {
			return;
		}

		let active = true;
		const loadProjects = async () => {
			setLoading(true);
			setLoadError("");
			try {
				const items = await getProjects();
				if (active) setOrders(items);
			} catch (error) {
				if (active) {
					setLoadError(getErrorMessage(error, "Не удалось загрузить заказы"));
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		void loadProjects();
		return () => {
			active = false;
		};
	}, [isCreatePage, isDetailPage]);

	useEffect(() => {
		if (!isDetailPage) {
			return;
		}

		if (currentOrderId === null) {
			return;
		}

		let active = true;
		const loadProject = async () => {
			setDetailLoading(true);
			setDetailError("");
			try {
				const order = await getProjectById(currentOrderId);
				if (!active) return;
				setCurrentOrder(order);
				setOrders((items) => upsertOrder(items, order));
			} catch (error) {
				if (!active) return;
				setCurrentOrder(null);
				setDetailError(getErrorMessage(error, "Не удалось загрузить заказ"));
			} finally {
				if (active) setDetailLoading(false);
			}
		};

		void loadProject();
		return () => {
			active = false;
		};
	}, [currentOrderId, isDetailPage]);

	const visibleOrder = useMemo(
		() =>
			currentOrderId === null
				? null
				: currentOrder ??
					orders.find((order) => order.id === currentOrderId) ??
					null,
		[currentOrder, currentOrderId, orders],
	);

	const persistOrder = (nextOrder: ProjectOrder) => {
		setCurrentOrder(nextOrder);
		setOrders((items) => upsertOrder(items, nextOrder));
	};

	const updateOrder = async (nextOrder: ProjectOrder) => {
		const previousOrder = visibleOrder;
		persistOrder(nextOrder);

		try {
			const savedOrder = await updateProjectRequest(nextOrder);
			persistOrder(savedOrder);
		} catch (error) {
			if (previousOrder) persistOrder(previousOrder);
			throw error;
		}
	};

	if (isCreatePage) {
		return (
			<CreateOrderPage
				onBack={() => navigate("/projects")}
				onCreated={(order) => {
					persistOrder(order);
					navigate(`/projects/${order.id}`);
				}}
			/>
		);
	}

	if (isDetailPage) {
		if (detailLoading && !visibleOrder) {
			return (
				<main className="orders-page">
					<PageState
						variant="loading"
						title="Загружаем заказ"
						text="Получаем данные проекта и отклики."
					/>
				</main>
			);
		}

		if (detailError) {
			return (
				<main className="orders-page">
					<PageState
						variant="error"
						title="Не удалось загрузить заказ"
						text={detailError}
						action="К заказам"
						onAction={() => navigate("/projects")}
					/>
				</main>
			);
		}

		if (!visibleOrder) {
			return (
				<main className="orders-page">
					<EmptyState
						title="Заказ не найден"
						text="Такого заказа нет или у вас нет доступа к нему."
						action="К заказам"
						onAction={() => navigate("/projects")}
					/>
				</main>
			);
		}

		return (
			<ProjectWorkspacePage
				key={`${visibleOrder.id}-${visibleOrder.updatedAt}`}
				order={visibleOrder}
				canEdit={
					isAdmin ||
					(normalizedRole === "client" && visibleOrder.hirerId === user?.id)
				}
				onBack={() => navigate("/projects")}
				onChange={updateOrder}
			/>
		);
	}

	return (
		<OrdersPage
			key={initialCategory}
			loading={loading}
			error={loadError}
			orders={orders}
			initialCategory={initialCategory}
			onCreate={() => navigate("/projects/new")}
			onOpen={(id) => navigate(`/projects/${id}`)}
		/>
	);
}
