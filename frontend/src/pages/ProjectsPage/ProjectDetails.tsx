import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getProjectById } from "@/features/getProjects/getProjectById";
import "./ProjectDetails.css";

type Project = {
	id: string;
	title: string;
	category: string;
	icon: string;
	description: string;
	fullDescription?: string;
	company: string;
	price: string;
};

type LocationState = {
	projectPreview?: Project;
};

export default function ProjectDetails() {
	const { projectId } = useParams();
	const location = useLocation();

	const state = location.state as LocationState | null;

	const [project, setProject] = useState<Project | null>(
		state?.projectPreview || null,
	);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!projectId) {
			setError("ID проекта не найден");
			return;
		}

		const loadProject = async () => {
			try {
				setLoading(true);
				setError("");

				const data = await getProjectById(projectId);

				setProject(data.project);
			} catch {
				setError("Не удалось загрузить проект");
			} finally {
				setLoading(false);
			}
		};

		loadProject();
	}, [projectId]);

	if (loading && !project) {
		return (
			<section className="project-details">
				<p>Загрузка проекта...</p>
			</section>
		);
	}

	if (error) {
		return (
			<section className="project-details">
				<p>{error}</p>
			</section>
		);
	}

	if (!project) {
		return (
			<section className="project-details">
				<p>Проект не найден</p>
			</section>
		);
	}

	return (
		<section className="project-details">
			<h1>
				{project.icon} {project.title}
			</h1>
			<p className="">{project.company}</p>
			<p className="project-details-category">
				Категория: {project.category}
			</p>
			<p className="project-details-price">{project.price}</p>
			<div className="project-details-content">
				<h2>Краткое описание</h2>

				<p>{project?.description}</p>
			</div>
			<div className="project-details-content">
				<h2>Подробное описание</h2>
				<p>{project?.fullDescription}</p>
			</div>
		</section>
	);
}
