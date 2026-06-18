type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Отмена",
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!open) {
		return null;
	}

	return (
		<div className="confirm-dialog-backdrop" onClick={busy ? undefined : onCancel}>
			<div
				className="confirm-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
				onClick={(event) => event.stopPropagation()}
			>
				<h2 id="confirm-dialog-title">{title}</h2>
				<p>{description}</p>
				<div className="confirm-dialog__actions">
					<button
						type="button"
						className="hm-button hm-button--ghost"
						onClick={onCancel}
						disabled={busy}
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						className="hm-button hm-button--danger"
						onClick={onConfirm}
						disabled={busy}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
