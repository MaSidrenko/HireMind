import "./PageState.css";

type PageStateProps = {
	variant?: "loading" | "error" | "empty";
	title: string;
	text?: string;
	action?: string;
	onAction?: () => void;
};

export default function PageState({
	variant = "empty",
	title,
	text,
	action,
	onAction,
}: PageStateProps) {
	return (
		<section className={`page-state page-state--${variant}`} aria-live="polite">
			{variant === "loading" ? (
				<span className="page-state__spinner" aria-hidden="true" />
			) : null}
			<div>
				<strong>{title}</strong>
				{text ? <p>{text}</p> : null}
			</div>
			{action && onAction ? (
				<button type="button" className="page-state__button" onClick={onAction}>
					{action}
				</button>
			) : null}
		</section>
	);
}
