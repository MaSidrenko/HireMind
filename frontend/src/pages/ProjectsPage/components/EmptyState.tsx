type EmptyStateProps ={
	title: string;
	text: string;
	action?: string;
	onAction?: () => void;
};

export function EmptyState({title, text, action, onAction}: EmptyStateProps) {
	return (
		<div className="hm-empty">
			<strong>{title}</strong>
			<p>{text}</p>
			{action && onAction ? (
				<button type="button" className="hm-button hm-button--ghost" onClick={onAction}>
					{action}
				</button>
			): null}
		</div>
	);
}