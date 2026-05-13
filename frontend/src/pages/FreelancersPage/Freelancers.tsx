import { useCallback, useEffect, useMemo, useState } from "react";
import {
	formatBudget,
	getContactRequests,
	getFreelancers,
	sendContactRequest,
	type ContactRequest,
	type Freelancer,
} from "@/features";
import { PageState } from "@/widgets";
import "./Freelancers.css";

export default function Freelancers() {
	const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
	const [requests, setRequests] = useState<ContactRequest[]>([]);
	const [skill, setSkill] = useState("");
	const [selected, setSelected] = useState<Freelancer | null>(null);
	const [message, setMessage] = useState(
		"Здравствуйте! Хочу обсудить проект и уточнить вашу доступность.",
	);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState("");

	const loadFreelancers = useCallback(() => {
		setLoading(true);
		setError("");
		Promise.all([getFreelancers(), getContactRequests()])
			.then(([freelancersItems, requestItems]) => {
				setFreelancers(freelancersItems);
				setRequests(requestItems);
			})
			.catch(() => setError("Не удалось загрузить список фрилансеров"))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		loadFreelancers();
	}, [loadFreelancers]);

	const filtered = useMemo(() => {
		const query = skill.trim().toLowerCase();
		if (!query) return freelancers;
		return freelancers.filter((freelancer) =>
			freelancer.skills.some((item) =>
				item.toLocaleLowerCase().includes(query),
			),
		);
	}, [freelancers, skill]);

	const selectedRequest = selected
		? requests.find(
				(request) =>
					request.freelancerId === selected.id &&
					request.status === "sent",
			)
		: null;

	const contact = async () => {
		if(!selected || selectedRequest) return;
		setSending(true);
		setError("");
		try {
			const request = await sendContactRequest({
				freelancerId: selected.id,
				message,
				status: "sent",
				createdAt: new Date().toISOString()
			});
			setRequests((items) => [request, ...items.filter((item) => item.id !== request.id)]);

		} catch {
			setError("Не удалось отправить заявку");
		} finally {
			setSending(false);
		}
	};

	return (
		<main className="freelancers-page">
			<h1>Фрилансеры</h1>
			<section className="freelancers-filter">
				<input value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="Навык, например React"/>
				<span>{loading ? "Загрузка..." : `${filtered.length} специалистов`}</span>
			</section>
			{loading ? (
				<PageState
					variant="loading"
					title="Загружаем фрилансеров"
					text="Получаем специалистов и статусы заявок."
				/>
			) : null}
			{!loading && error ? (
				<PageState
					variant="error"
					title={error}
					text="Проверьте backend или повторите загрузку."
					action="Повторить"
					onAction={loadFreelancers}
				/>
			):  null}

			{!loading && !error && filtered.length === 0 ? (
				<PageState
					variant="empty"
					title="Специалисты не найдены"
					text="Попробуйте другой навык или очистите фильтр."
					action={skill ? "Очистить фильтр" : undefined}
					onAction={skill ? () => setSkill("") : undefined}
				/>
			):  null}

			{!loading && !error && filtered.length > 0 ? (
				<section className="freelancers-layout">
				<div className="freelancers-list">
					{filtered.map((freelancer) => {
						const hasRequest = requests.some(
							(request) => request.freelancerId === freelancer.id && request.status === "sent",
						);
						return (
							<article key={freelancer.id} className="freelancer-card">
								<div>
									<span className={freelancer.isOnline ? "online-dot" : "online-dot offline"}/>
									<h2>{freelancer.fullName}</h2>
									<strong>{freelancer.headline}</strong>
									<p>{freelancer.bio}</p>
									<div className="freelancer-skills">
										{freelancer.skills.map((item) => <span key={item}>{item}</span>)}
									</div>
								</div>
								<div className="freelancer-side">
									<strong>{freelancer.rating.toFixed(1)} / 5</strong>
									<span>{freelancer.completedProjects} проектов</span>
									<span>{formatBudget({budgetMin: freelancer.hourlyRate, budgetMax: freelancer.hourlyRate, currency: freelancer.currency, budgetType: "hourly"})}</span>
									<button type="button" onClick={() => setSelected(freelancer)}>
										{hasRequest ? "Заявка отправлена" : "Связаться"}
									</button>
								</div>
							</article>
						);
					})}
				</div>

				<aside className="contact-panel">
					{selected ? (
						<>
							<span>Контакт</span>
							<h2>{selected.fullName}</h2>
							<p>{selected.contacts.telegram} · {selected.contacts.email}</p>
							<textarea value={message} onChange={(event) => setMessage(event.target.value)} />
							<button type="button" onClick={contact} disabled={sending || !!selectedRequest}>
								{selectedRequest ? "Заявка уже отправлена" : sending ? "Отправляем..." : "Отправить заявку"}
							</button>	
							{selectedRequest ? <strong>Статус: отправлена</strong> : null}
						</>
					) : (
						<p>Выберите специалиста, чтобы увидеть контакты и отправить заявку.</p>
					)}
				</aside>
			</section>
			) : null}
		</main>
	);
}
