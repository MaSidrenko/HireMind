import { useState } from "react";
import "./contextStripMenu.css";

type ContextStripMenuProps = {
	title: string;
	items: string[];
	onSelect?: (item: string) => void;
};

export default function ContextStripMenu({
	title,
	items,
	onSelect,
}: ContextStripMenuProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="dropdown">
			<button
				className="dropdown-button"
				onClick={() => setIsOpen((prev) => !prev)}
			>
				{title}
			</button>

			{isOpen && (
				<ul className="dropdown-menu">
					{items.map((item, index) => (
						<li
							key={index}
							className="dropdown-item"
							onClick={() => {
								onSelect?.(item);
								setIsOpen(false);
							}}
						>
							{item}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
