import { useLocation, useNavigate } from "react-router-dom";
import "./Projects.css";
import { useEffect, useState } from "react";
import { useDebounce } from "@/widgets/debounce/debounce";
import { getProjects } from "@/features/getProjects/getProject";

type LocationState = {
	chosenCategory?: string;
};

type SortBy = "default" | "price-asc" | "price-desc" | "title-asc";

const categories = [
	"Все проекты",
	"Веб-разработка",
	"Дизайн",
	"Копирайтинг",
	"Мобильная разработка",
	"Маркетинг",
];

type Project = {
	id: string;
	title: string;
	category: string;
	icon: string;
	description: string;
	company: string;
	price: string;
};

export default function Projects() {
	const location = useLocation();
	const navigate = useNavigate();

	const state = location.state as LocationState | null;

	const [category, setCategory] = useState(
		state?.chosenCategory || "Все проекты",
	);

	const [projectName, setProjectName] = useState("");
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [priceFrom, setPriceFrom] = useState("");
	const [priceTo, setPriceTo] = useState("");
	const [sortBy, setSortBy] = useState<SortBy>("default");

	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const limit = 6;

	const debouncedProjectName = useDebounce(projectName, 400);

	const handleProjectClick = (project: Project) => {
		navigate(`/projects/${project.id}`, {
			state: {
				projectPreview: project,
			},
		});
	};

	const goToPreviousPage = () => {
		setPage((prev) => Math.max(prev - 1, 1));
	};

	const goToNextPage = () => {
		setPage((prev) => Math.min(prev + 1, totalPages));
	};

	const resetFilters = () => {
		setCategory("Все проекты");
		setProjectName("");
		setPriceFrom("");
		setPriceTo("");
		setSortBy("default");
		setPage(1);
	};

	useEffect(() => {
		const loadProjects = async () => {
			try {
				setLoading(true);
				setError("");

				const data = await getProjects({
					name: debouncedProjectName,
					category,
					page,
					limit,
					priceFrom,
					priceTo,
					sortBy,
				});

				setProjects(data.projects);
				setTotal(data.total);
				setTotalPages(data.totalPages);
				setPage(data.page);
			} catch {
				setError("Не удалось загрузить проекты");
			} finally {
				setLoading(false);
			}
		};

		loadProjects();
	}, [
		debouncedProjectName,
		category,
		page,
		limit,
		priceFrom,
		priceTo,
		sortBy,
	]);

	return (
		<section className="projects">
			<h1>Проекты</h1>

			<form
				className="projects-filters"
				onSubmit={(event) => event.preventDefault()}
			>
				<select
					value={category}
					onChange={(event) => {
						setCategory(event.target.value);
						setPage(1);
					}}
				>
					{categories.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>

				<input
					type="text"
					placeholder="Название проекта"
					value={projectName}
					onChange={(event) => {
						setProjectName(event.target.value);
						setPage(1);
					}}
				/>

				<input
					type="number"
					min="0"
					placeholder="Цена от"
					value={priceFrom}
					onChange={(event) => {
						setPriceFrom(event.target.value);
						setPage(1);
					}}
				/>

				<input
					type="number"
					min="0"
					placeholder="Цена до"
					value={priceTo}
					onChange={(event) => {
						setPriceTo(event.target.value);
						setPage(1);
					}}
				/>

				<select
					value={sortBy}
					onChange={(event) => {
						setSortBy(event.target.value as SortBy);
						setPage(1);
					}}
				>
					<option value="default">Без сортировки</option>
					<option value="price-asc">Сначала дешёвые</option>
					<option value="price-desc">Сначала дорогие</option>
					<option value="title-asc">По названию</option>
				</select>

				<button
					type="button"
					className="projects-reset-button"
					onClick={resetFilters}
				>
					Сбросить
				</button>
			</form>

			{loading && <p className="projects-status">Загрузка проектов...</p>}

			{error && <p className="projects-error">{error}</p>}

			{!loading && !error && (
				<>
					<p className="projects-status">Найдено проектов: {total}</p>

					<div className="projects-list">
						{projects.length > 0 ? (
							projects.map((project) => (
								<article
									key={project.id}
									className="project-card"
									onClick={() => handleProjectClick(project)}
									role="button"
									tabIndex={0}
									onKeyDown={(event) => {
										if (
											event.key === "Enter" ||
											event.key === " "
										) {
											handleProjectClick(project);
										}
									}}
								>
									<h2 className="project-title">
										{project.icon} {project.title}
									</h2>

									<div className="project-container">
										<p>{project.description}</p>
										<p>{project.price}</p>
										<p>Категория: {project.category}</p>
										<p>Компания: {project.company}</p>
									</div>
								</article>
							))
						) : (
							<p className="projects-status">
								Проекты не найдены
							</p>
						)}
					</div>

					{totalPages > 1 && (
						<div className="projects-pagination">
							<button
								type="button"
								onClick={goToPreviousPage}
								disabled={page === 1}
								className="project-pagination-btn"
							>
								Назад
							</button>

							<span className="projects-pagination-info">
								Страница {page} из {totalPages}
							</span>

							<button
								type="button"
								onClick={goToNextPage}
								disabled={page === totalPages}
								className="project-pagination-btn"
							>
								Вперёд
							</button>
						</div>
					)}
				</>
			)}
		</section>
	);
}
